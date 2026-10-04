"use client";

import { usePathname } from "next/navigation";

/** The current path (`/admin/...`; there is no rewrite, so it is what the address bar shows). */
export function useAdminPathname(): string {
  return usePathname();
}
