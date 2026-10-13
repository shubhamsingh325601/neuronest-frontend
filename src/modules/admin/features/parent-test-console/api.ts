import { createChatClient, type ChatClient } from "@/modules/chat-client/client";
import { ChatApiError } from "@/modules/chat-client/problem";
import { impersonationSchema, type ImpersonationResult } from "@/modules/chat-client/types";
import { apiClient } from "../../lib/api-client";
import { parentConsoleApiOrigin } from "./flag";
import { getExpertToken, getParentToken } from "./state/session";

/**
 * The one admin-token call: `POST users/:id/impersonate` through the BFF (allowlisted only while the console
 * flag is on). The response holds a parent access token, so callers hand it straight to the session store.
 */
export function impersonateParent(parentId: string, signal?: AbortSignal): Promise<ImpersonationResult> {
  return apiClient.post(`users/${encodeURIComponent(parentId)}/impersonate`, { schema: impersonationSchema, signal });
}

export interface ExpertSignIn {
  token: string;
  user: { id: string; name: string; email: string };
}

/**
 * Expert sign-in: `POST auth/login` (tokens only, no user object), then `GET users/me` to confirm the role. The
 * token lives in a closure for the second call and is returned to the caller, which puts it in the session store.
 * `fetchImpl` is for tests.
 */
export async function signInExpert(origin: string, email: string, password: string, fetchImpl?: typeof fetch): Promise<ExpertSignIn> {
  const anonymous = createChatClient({ baseUrl: origin, getToken: () => null, fetch: fetchImpl });
  const { accessToken } = await anonymous.login(email, password);
  const me = await createChatClient({ baseUrl: origin, getToken: () => accessToken, fetch: fetchImpl }).me();
  if (me.role !== "EXPERT") {
    throw new ChatApiError({
      status: 403,
      code: NOT_AN_EXPERT,
      title: "Not an expert",
      detail: "This account is not an expert.",
    });
  }
  return { token: accessToken, user: { id: me.id, name: me.name, email: me.email } };
}

/** Raised here when a valid login belongs to a non-expert account. */
export const NOT_AN_EXPERT = "NOT_AN_EXPERT";

export interface ConsoleClients {
  /** Calls made as the impersonated parent. */
  parent: ChatClient;
  /** Calls made as the expert who signed in on the Expert pane (`getToken` is null until then). */
  expert: ChatClient;
}

let cached: { origin: string; clients: ConsoleClients } | null = null;

/**
 * Chat clients that talk straight to the backend (not through the BFF), with the token read from the session
 * store at call time. Null while the API URL is not configured.
 */
export function getConsoleClients(): ConsoleClients | null {
  const origin = parentConsoleApiOrigin();
  if (!origin) return null;
  if (cached?.origin !== origin) {
    cached = {
      origin,
      clients: {
        parent: createChatClient({ baseUrl: origin, getToken: getParentToken }),
        expert: createChatClient({ baseUrl: origin, getToken: getExpertToken }),
      },
    };
  }
  return cached.clients;
}
