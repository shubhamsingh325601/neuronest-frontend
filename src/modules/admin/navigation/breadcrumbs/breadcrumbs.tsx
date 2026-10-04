"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminPathname } from "../use-admin-pathname";
import { resolveBreadcrumbs } from "./registry";

// Renders the registry trail for the current path. Below sm it collapses to "parent > current".
export function Breadcrumbs({ className }: { className?: string }) {
  const crumbs = resolveBreadcrumbs(useAdminPathname());
  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const isParent = index === crumbs.length - 2;
          return (
            <li key={crumb.href} className={cn("flex items-center gap-1.5", !isLast && !isParent && "max-sm:hidden")}>
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <>
                  <Link href={crumb.href} className="truncate rounded-sm hover:text-foreground hover:underline">
                    {crumb.label}
                  </Link>
                  <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
