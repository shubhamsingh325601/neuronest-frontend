import { cookies } from "next/headers";
import { handleRefreshNavigation, handleRefreshPost } from "@/modules/admin/auth/session-routes";

// GET: reached by redirect from the console layout when the access cookie is gone (Server Components cannot
// set cookies). POST: SessionKeeper's proactive refresh.
export async function GET(request: Request) {
  return handleRefreshNavigation(request, { cookieStore: await cookies() });
}

export async function POST(request: Request) {
  return handleRefreshPost(request, { cookieStore: await cookies() });
}
