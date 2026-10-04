/** What the shell needs to know about the signed-in admin (safe to pass to client components). */
export interface ShellSession {
  name: string;
  email: string;
  role: string;
}
