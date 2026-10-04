import { cookies } from "next/headers";
import { handleSessionEnded } from "@/modules/admin/auth/session-routes";

export async function GET(request: Request) {
  return handleSessionEnded(request, { cookieStore: await cookies() });
}
