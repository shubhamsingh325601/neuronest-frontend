"use client";

import { SidebarNav, type NavBadges } from "./sidebar-nav";
import { BrandMark } from "../auth/brand-mark";

// Desktop (>= lg): expanded or user-collapsed. Tablet (md to lg): always an icon rail. Below md it is hidden
// and the MobileDrawer takes over. Width and labels follow `html[data-sidebar]` (set pre-paint) via CSS.
export function Sidebar({ badges }: { badges: NavBadges }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex lg:w-64 lg:in-data-[sidebar=collapsed]:w-16">
      <div className="flex h-16 items-center px-3.5">
        <BrandMark size={36} className="max-lg:[&>span:last-child]:hidden in-data-[sidebar=collapsed]:[&>span:last-child]:hidden" />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        <SidebarNav variant="desktop" badges={badges} />
      </div>
    </aside>
  );
}
