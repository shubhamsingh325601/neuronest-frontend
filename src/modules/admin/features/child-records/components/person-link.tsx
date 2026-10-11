"use client";

import Link from "next/link";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { useUserQuery } from "../../users/hooks/use-users";

/** A person's name looked up by id (the shared users lookup), linking to their Users record whatever their role. */
export function PersonLink({ id }: { id: string }) {
  const user = useUserQuery(id);
  return (
    <Link href={`${ADMIN_ROUTES.users}/${encodeURIComponent(id)}`} className="hover:underline">
      {user.data?.name ?? (user.isError ? "View user" : "…")}
    </Link>
  );
}
