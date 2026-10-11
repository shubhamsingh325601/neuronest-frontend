import Link from "next/link";
import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { SortHeader } from "../../../ui/sort-header";
import { StatusBadge } from "../../../ui/status-badge";
import type { PlanTemplate } from "../api/types";

const ACCESSORS = {
  title: (t: PlanTemplate) => t.title,
  status: (t: PlanTemplate) => t.status,
  days: (t: PlanTemplate) => t.days.length,
  created: (t: PlanTemplate) => timeValue(t.createdAt),
  updated: (t: PlanTemplate) => timeValue(t.updatedAt),
};

export function TemplateTable({ templates }: { templates: PlanTemplate[] }) {
  const { sorted, sort, toggle } = useSortedItems(templates, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Plan templates</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Title" column="title" sort={sort} onSort={toggle} />
            <SortHeader label="Status" column="status" sort={sort} onSort={toggle} />
            <SortHeader label="Days" column="days" sort={sort} onSort={toggle} />
            <SortHeader label="Created" column="created" sort={sort} onSort={toggle} />
            <SortHeader label="Updated" column="updated" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((template) => (
            <tr key={template.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link href={`${ADMIN_ROUTES.planTemplates}/${encodeURIComponent(template.id)}`} className="hover:underline">
                  {template.title}
                </Link>
              </th>
              <td className="px-4 py-3"><StatusBadge status={template.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{template.days.length}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(template.createdAt)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(template.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
