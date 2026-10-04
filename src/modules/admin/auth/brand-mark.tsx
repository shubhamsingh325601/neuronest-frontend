import Image from "next/image";
import { cn } from "@/lib/utils";

// The logo artwork has an opaque cream background, so it always sits on a rounded tile: it reads well in both themes.
export function BrandMark({ className, size = 44 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="overflow-hidden rounded-xl ring-1 ring-border" style={{ width: size, height: size }}>
        <Image
          src="/assets/icons/logo.png"
          alt="NeuroNest logo"
          width={size}
          height={size}
          priority
          className="size-full object-cover"
        />
      </span>
      <span className="grid leading-tight">
        <span className="text-base font-semibold tracking-tight">NeuroNest</span>
        <span className="text-xs text-current/70">Admin console</span>
      </span>
    </span>
  );
}
