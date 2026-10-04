"use client";

import { Bell, Search } from "lucide-react";
import { useUiStore } from "../state/ui-store";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { EmptyState } from "./states";

// PLACEHOLDERS (M2). The real command palette and notification centre arrive in M5. These keep the topbar
// triggers honest: they open, explain, and close, with focus handled by Radix.
export function OverlayPlaceholders() {
  const commandOpen = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const notificationsOpen = useUiStore((s) => s.notificationsOpen);
  const setNotificationsOpen = useUiStore((s) => s.setNotificationsOpen);

  return (
    <>
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>Frontend placeholder: global search is not built yet.</DialogDescription>
          </DialogHeader>
          <EmptyState icon={Search} title="Search is coming" description="For now, use the sidebar to move around the console." />
        </DialogContent>
      </Dialog>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Frontend placeholder: the notification centre is not built yet.</SheetDescription>
          </SheetHeader>
          <EmptyState icon={Bell} title="Nothing here yet" description="Sample notifications will appear here, clearly labelled as sample data." />
        </SheetContent>
      </Sheet>
    </>
  );
}
