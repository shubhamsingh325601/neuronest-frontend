"use client";

import { BrandMark } from "../auth/brand-mark";
import { useUiStore } from "../state/ui-store";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../ui/sheet";
import { SidebarNav, type NavBadges } from "./sidebar-nav";

// Off-canvas navigation below md. Radix Dialog gives the focus trap, Escape and focus restore.
export function MobileDrawer({ badges }: { badges: NavBadges }) {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-72 gap-6 bg-sidebar p-4 text-sidebar-foreground md:hidden">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">Admin console sections</SheetDescription>
        <BrandMark size={36} />
        <div className="-mx-2 flex-1 overflow-y-auto px-2">
          <SidebarNav variant="drawer" badges={badges} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
