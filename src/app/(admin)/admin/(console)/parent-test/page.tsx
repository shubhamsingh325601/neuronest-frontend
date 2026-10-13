import { notFound } from "next/navigation";
import { isParentConsoleEnabled } from "@/modules/admin/features/parent-test-console/flag"; // parent-console:
import { ParentTestConsolePage } from "@/modules/admin/features/parent-test-console/parent-test-console-page"; // parent-console:

// parent-console: the temporary Parent test console (plan 0003). A real 404 unless NEXT_PUBLIC_ADMIN_PARENT_CONSOLE=1.
export default function Page() {
  if (!isParentConsoleEnabled()) notFound();
  return <ParentTestConsolePage />;
}
