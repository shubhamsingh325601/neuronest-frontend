import Link from "next/link";
import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { SortHeader } from "../../../ui/sort-header";
import { StatusBadge } from "../../../ui/status-badge";
import type { UserSummary } from "../api/types";
import { roleLabel } from "../role-label";

const ACCESSORS = {
  name: (u: UserSummary) => u.name,
  email: (u: UserSummary) => u.email,
  role: (u: UserSummary) => roleLabel(u.role),
  status: (u: UserSummary) => u.status,
  joined: (u: UserSummary) => timeValue(u.createdAt),
};

export function UserTable({ users }: { users: UserSummary[] }) {
  const { sorted, sort, toggle } = useSortedItems(users, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Users</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Name" column="name" sort={sort} onSort={toggle} />
            <SortHeader label="Email" column="email" sort={sort} onSort={toggle} />
            <SortHeader label="Role" column="role" sort={sort} onSort={toggle} />
            <SortHeader label="Status" column="status" sort={sort} onSort={toggle} />
            <SortHeader label="Joined" column="joined" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((user) => (
            <tr key={user.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link href={`${ADMIN_ROUTES.users}/${encodeURIComponent(user.id)}`} className="hover:underline">
                  {user.name}
                </Link>
              </th>
              <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
              <td className="px-4 py-3">{roleLabel(user.role)}</td>
              <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
