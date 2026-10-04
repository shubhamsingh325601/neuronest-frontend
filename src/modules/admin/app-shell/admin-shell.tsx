"use client";

import { useEffect } from "react";
import type { ShellSession } from "../auth/session-types";
import { useUiStore } from "../state/ui-store";
import { MobileDrawer } from "./mobile-drawer";
import { MockDataChip } from "./mock-data-chip";
import { OverlayPlaceholders } from "./overlay-placeholders";
import { Sidebar } from "./sidebar";
import type { NavBadges } from "./sidebar-nav";
import { Topbar } from "./topbar";

interface AdminShellProps {
  session: ShellSession;
  mockSources: string[];
  badges?: NavBadges;
  children: React.ReactNode;
}

export function AdminShell({ session, mockSources, badges = {}, children }: AdminShellProps) {
  const hydrateSidebar = useUiStore((s) => s.hydrateSidebar);
  useEffect(() => hydrateSidebar(), [hydrateSidebar]);

  return (
    <div className="flex min-h-dvh bg-background">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar badges={badges} />
      <MobileDrawer badges={badges} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} mockSources={mockSources} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8">
          <div className="mb-4 md:hidden">
            <MockDataChip sources={mockSources} />
          </div>
          {children}
        </main>
      </div>
      <OverlayPlaceholders />
    </div>
  );
}
