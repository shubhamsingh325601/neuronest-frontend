"use client";

import { usePathname } from "next/navigation";
import { normalizeAdminPath } from "./paths";

/** The current path as users see it (no internal `/admin` prefix). */
export function useAdminPathname(): string {
  return normalizeAdminPath(usePathname());
}
