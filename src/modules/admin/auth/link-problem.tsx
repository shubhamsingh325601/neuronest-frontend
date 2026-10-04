import Link from "next/link";
import { Button } from "../ui/button";
import { FormAlert } from "./form-alert";

/** Shown when a reset / setup link has no token at all. (An expired token is reported by the backend on submit.) */
export function LinkProblem({ message, actionHref, actionLabel }: { message: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="grid gap-5">
      <FormAlert tone="error">{message}</FormAlert>
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
