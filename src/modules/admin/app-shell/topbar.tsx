"use client";

import { Bell, PanelLeft, Search } from "lucide-react";
import { Breadcrumbs } from "../navigation/breadcrumbs/breadcrumbs";
import type { ShellSession } from "../auth/session-types";
import { useUiStore } from "../state/ui-store";
import { ThemeToggle } from "../theme/theme-toggle";
import { Button } from "../ui/button";
import { MockDataChip } from "./mock-data-chip";
import { UserMenu } from "./user-menu";

export function Topbar({ session, mockSources }: { session: ShellSession; mockSources: string[] }) {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const setNotificationsOpen = useUiStore((s) => s.setNotificationsOpen);

  // >= lg collapses the sidebar; below md opens the drawer. (The md rail is fixed, so the button is hidden there.)
  function onToggle() {
    if (window.matchMedia("(min-width: 1024px)").matches) toggleSidebar();
    else setMobileNavOpen(true);
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Button variant="ghost" size="icon" aria-label="Toggle navigation" onClick={onToggle} className="md:max-lg:hidden">
          <PanelLeft aria-hidden="true" />
        </Button>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-11 min-w-0 max-w-md flex-1 items-center gap-2.5 rounded-full border border-input bg-card px-4 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Search"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Search anything here</span>
          <kbd className="ml-auto hidden rounded-md border bg-muted px-1.5 py-0.5 font-sans text-xs sm:block">Ctrl K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden md:block">
            <MockDataChip sources={mockSources} />
          </span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => setNotificationsOpen(true)} className="relative">
            <Bell aria-hidden="true" />
            <span aria-hidden="true" className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          </Button>
          <UserMenu session={session} />
        </div>
      </div>
      <Breadcrumbs className="px-4 pb-2.5 sm:px-6" />
    </header>
  );
}
