import Link from "next/link";
import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { SortHeader } from "../../../ui/sort-header";
import { formatAge } from "../age";
import type { Child } from "../api/types";
import { ParentLink } from "./parent-link";

// Age sorts by date of birth, so ascending is youngest first. Parent names load per row, so that column is not sortable.
const ACCESSORS = {
  name: (c: Child) => c.name,
  age: (c: Child) => {
    const born = timeValue(c.dateOfBirth);
    return born === null ? null : -born;
  },
  added: (c: Child) => timeValue(c.createdAt),
};

export function ChildTable({ items }: { items: Child[] }) {
  const { sorted, sort, toggle } = useSortedItems(items, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Children</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Child" column="name" sort={sort} onSort={toggle} />
            <SortHeader label="Age" column="age" sort={sort} onSort={toggle} />
            <th scope="col" className="px-4 py-3 font-medium">Parent</th>
            <SortHeader label="Added" column="added" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((child) => (
            <tr key={child.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link href={`${ADMIN_ROUTES.children}/${encodeURIComponent(child.id)}`} className="hover:underline">
                  {child.name}
                </Link>
              </th>
              <td className="px-4 py-3 text-muted-foreground">{formatAge(child.dateOfBirth)}</td>
              <td className="px-4 py-3 text-muted-foreground"><ParentLink parentId={child.parentId} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(child.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
