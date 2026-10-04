import { AdminShell } from "@/modules/admin/app-shell/admin-shell";
import { SessionKeeper } from "@/modules/admin/auth/session-keeper";
import { requireAdmin } from "@/modules/admin/auth/session";
import { getActiveMockSources } from "@/modules/admin/config/shell-stub";

// Rendered per request: the session guard reads cookies, and the shell derives active nav state from the URL,
// which behind the proxy rewrite differs from the prerendered source path.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  // The real gate (plan 0001 §16/§17): redirects to sign-in / refresh / forced sign-out unless ADMIN + ACTIVE.
  const { shell, refreshAt } = await requireAdmin();
  return (
    <AdminShell session={shell} mockSources={getActiveMockSources()}>
      <SessionKeeper refreshAt={refreshAt} />
      {children}
    </AdminShell>
  );
}
