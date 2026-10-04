import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, ErrorCode, isAccessTokenRejected } from "../lib/api-errors";
import { fetchMe, type UserProfile } from "./backend-auth";
import { readSessionCookies } from "./cookies";
import { NEXT_PATH_HEADER } from "./request-headers";
import { safeNextPath } from "./safe-next";
import type { ShellSession } from "./session-types";
import { readTokenWindow, refreshAtFor } from "./token-timing";

// The real gate (plan 0001 §16/§17). The proxy only checks that a cookie exists; this asks the backend who
// the cookie belongs to and requires ADMIN + ACTIVE. Server Components cannot set cookies, so the cases that
// need cookie changes are handed to route handlers (refresh / session-ended) by redirect.

export type SessionState =
  | { status: "active"; user: UserProfile; refreshAt: number | null }
  | { status: "anonymous" }
  /** Access token missing or rejected but a refresh token exists: refresh, then come back. */
  | { status: "refresh" }
  | { status: "suspended" }
  | { status: "forbidden" };

export const getSession = cache(async (): Promise<SessionState> => {
  const cookieStore = await cookies();
  const { accessToken, refreshToken } = readSessionCookies(cookieStore);
  const refreshable: SessionState = refreshToken ? { status: "refresh" } : { status: "anonymous" };
  if (!accessToken) return refreshable;

  let user: UserProfile;
  try {
    user = await fetchMe(accessToken);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === ErrorCode.AccountNotActive) return { status: "suspended" };
      if (isAccessTokenRejected(error)) return refreshable;
    }
    throw error; // backend down / 5xx / throttled: the console error boundary shows it, the session stays.
  }

  if (user.role !== "ADMIN") return { status: "forbidden" };
  if (user.status !== "ACTIVE") return { status: "suspended" };

  const window = readTokenWindow(accessToken);
  return { status: "active", user, refreshAt: window ? refreshAtFor(window) : null };
});

export interface ActiveSession {
  user: UserProfile;
  shell: ShellSession;
  refreshAt: number | null;
}

/** The page the visitor asked for, forwarded by the proxy (browser URL, not the internal `/admin/...` one). */
async function requestedPath(): Promise<string> {
  const value = (await headers()).get(NEXT_PATH_HEADER);
  return safeNextPath(value);
}

const nextQuery = (path: string) => `next=${encodeURIComponent(path)}`;

export async function requireAdmin(): Promise<ActiveSession> {
  const session = await getSession();
  switch (session.status) {
    case "active": {
      const { user } = session;
      return {
        user,
        refreshAt: session.refreshAt,
        shell: { name: user.name?.trim() || user.email.split("@")[0], email: user.email, role: user.role },
      };
    }
    case "anonymous": {
      // The proxy already sends cookie-less visitors to /login, so reaching this means a stale or unusable
      // access cookie with no refresh cookie. `reason` stops the proxy from bouncing /login straight back.
      const path = await requestedPath();
      redirect(path === "/" ? "/login?reason=expired" : `/login?reason=expired&${nextQuery(path)}`);
    }
    case "refresh":
      redirect(`/api/auth/refresh?${nextQuery(await requestedPath())}`);
    case "suspended":
      redirect("/api/auth/session-ended?reason=suspended");
    case "forbidden":
      redirect("/api/auth/session-ended?reason=forbidden");
  }
}
