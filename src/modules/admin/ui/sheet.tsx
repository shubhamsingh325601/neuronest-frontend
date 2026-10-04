"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border bg-popover p-6 text-popover-foreground shadow-lg",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=closed]:animate-[admin-slide-out-right_200ms_ease-in] data-[state=open]:animate-[admin-slide-in-right_250ms_ease-out]",
        left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=closed]:animate-[admin-slide-out-left_200ms_ease-in] data-[state=open]:animate-[admin-slide-in-left_250ms_ease-out]",
        bottom:
          "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-xl border-t data-[state=closed]:animate-[admin-slide-out-bottom_200ms_ease-in] data-[state=open]:animate-[admin-slide-in-bottom_250ms_ease-out]",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export function SheetContent({
  className,
  children,
  side,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=closed]:animate-[admin-fade-out_200ms_ease-in] data-[state=open]:animate-[admin-fade-in_200ms_ease-out]" />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
        {children}
        <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-lg font-semibold leading-none", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}
