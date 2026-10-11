import Link from "next/link";
import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { SortHeader } from "../../../ui/sort-header";
import { StatusBadge } from "../../../ui/status-badge";
import type { Expert } from "../api/types";

const ACCESSORS = {
  name: (e: Expert) => e.name,
  email: (e: Expert) => e.email,
  status: (e: Expert) => e.status,
  added: (e: Expert) => timeValue(e.createdAt),
};

export function ExpertTable({ experts }: { experts: Expert[] }) {
  const { sorted, sort, toggle } = useSortedItems(experts, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="sr-only">Experts</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Name" column="name" sort={sort} onSort={toggle} />
            <SortHeader label="Email" column="email" sort={sort} onSort={toggle} />
            <SortHeader label="Status" column="status" sort={sort} onSort={toggle} />
            <SortHeader label="Added" column="added" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((expert) => (
            <tr key={expert.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link href={`${ADMIN_ROUTES.experts}/${encodeURIComponent(expert.id)}`} className="hover:underline">
                  {expert.name}
                </Link>
              </th>
              <td className="px-4 py-3 text-muted-foreground">{expert.email}</td>
              <td className="px-4 py-3"><StatusBadge status={expert.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(expert.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
