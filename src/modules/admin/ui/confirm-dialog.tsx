"use client";

import { useState } from "react";
import { AlertDialog } from "radix-ui";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

interface ConfirmDialogProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive and irreversible actions (suspend, archive) get the destructive style. */
  destructive?: boolean;
  /** May be async. The dialog stays open and both buttons are disabled until it settles; a throw keeps it open. */
  onConfirm: () => void | Promise<void>;
  /** Element that opens the dialog. Omit and use `open` / `onOpenChange` for controlled use. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  trigger,
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isOpen = open ?? internalOpen;

  function setOpen(next: boolean) {
    if (pending) return;
    if (open === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  async function handleConfirm(event: React.MouseEvent) {
    // AlertDialog.Action closes on click; hold it open while the action runs.
    event.preventDefault();
    setPending(true);
    try {
      await onConfirm();
      setPending(false);
      if (open === undefined) setInternalOpen(false);
      onOpenChange?.(false);
    } catch {
      // The caller surfaces the error (toast / inline); keep the dialog open so the user can retry.
      setPending(false);
    }
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setOpen}>
      {trigger ? <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger> : null}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-[admin-fade-out_150ms_ease-in] data-[state=open]:animate-[admin-fade-in_150ms_ease-out]" />
        <AlertDialog.Content
          className={cn(
            "fixed z-50 grid w-full gap-4 border bg-popover p-6 text-popover-foreground shadow-lg",
            "inset-x-0 bottom-0 rounded-t-xl data-[state=closed]:animate-[admin-slide-out-bottom_150ms_ease-in] data-[state=open]:animate-[admin-slide-in-bottom_200ms_ease-out]",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:data-[state=closed]:animate-[admin-zoom-out_150ms_ease-in] sm:data-[state=open]:animate-[admin-zoom-in_150ms_ease-out]",
          )}
        >
          <div className="grid gap-1.5">
            <AlertDialog.Title className="text-lg font-semibold leading-none">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialog.Description>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel
              disabled={pending}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              disabled={pending}
              onClick={handleConfirm}
              className={cn(buttonVariants({ variant: destructive ? "destructive" : "default" }))}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
