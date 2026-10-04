import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { readSessionCookies } from "@/modules/admin/auth/cookies";
import { handleBackendRequest } from "@/modules/admin/bff/handler";

// Thin: all logic (allowlist, CSRF, bearer injection) lives in modules/admin/bff.
async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const [{ path }, cookieStore] = await Promise.all([params, cookies()]);
  return handleBackendRequest(request, path, { accessToken: readSessionCookies(cookieStore).accessToken });
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
