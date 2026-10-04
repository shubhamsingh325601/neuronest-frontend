import Link from "next/link";
import { Compass } from "lucide-react";
import { ADMIN_ROUTES } from "@/modules/admin/navigation/paths";
import { EmptyState } from "@/modules/admin/app-shell/states";
import { Button } from "@/modules/admin/ui/button";

export default function ConsoleNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="This page does not exist or has moved."
      action={
        <Button asChild>
          <Link href={ADMIN_ROUTES.home}>Back to dashboard</Link>
        </Button>
      }
    />
  );
}
