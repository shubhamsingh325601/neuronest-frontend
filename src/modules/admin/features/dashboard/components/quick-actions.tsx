import Link from "next/link";
import { ArrowRight, ClipboardList, Stethoscope, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";

// Links only (plan 0001 §10). Targets that are still placeholder pages say so themselves when opened.
const ACTIONS = [
  { label: "Manage clinicians", href: "/clinicians", icon: Stethoscope },
  { label: "Browse users", href: "/users", icon: Users },
  { label: "Plan templates", href: "/plan-templates", icon: ClipboardList },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-1">
          {ACTIONS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                {label}
                <ArrowRight className="ml-auto size-3.5 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
