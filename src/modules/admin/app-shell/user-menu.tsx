"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { logoutAction } from "../auth/actions";
import type { ShellSession } from "../auth/session-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ session }: { session: ShellSession }) {
  const [signingOut, startTransition] = useTransition();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-11 items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-accent sm:pr-3"
          aria-label={`Account menu for ${session.name}`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(session.name)}
          </span>
          <span className="hidden text-sm font-medium sm:block">{session.name}</span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
          <span className="text-sm font-semibold text-foreground">{session.name}</span>
          <span className="text-xs font-normal">{session.email}</span>
          <span className="mt-1 text-xs font-medium uppercase tracking-wide">{session.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound aria-hidden="true" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signingOut}
          onSelect={(event) => {
            // Keep the menu mounted until the redirect so the pending state is visible.
            event.preventDefault();
            startTransition(async () => {
              await logoutAction();
            });
          }}
        >
          <LogOut aria-hidden="true" /> {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
