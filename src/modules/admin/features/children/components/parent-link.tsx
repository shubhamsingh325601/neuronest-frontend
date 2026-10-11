"use client";

import Link from "next/link";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { useUserQuery } from "../../users/hooks/use-users";

/** The parent's name, looked up by id (shared, long-lived cache); falls back to a generic link while loading. */
export function ParentLink({ parentId }: { parentId: string }) {
  const parent = useUserQuery(parentId);
  return (
    <Link href={`${ADMIN_ROUTES.users}/${encodeURIComponent(parentId)}`} className="hover:underline">
      {parent.data?.name ?? (parent.isError ? "View parent" : "…")}
    </Link>
  );
}
