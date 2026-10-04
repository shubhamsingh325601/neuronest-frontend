import Link from "next/link";
import { Compass } from "lucide-react";
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
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
