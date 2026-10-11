import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { Button } from "../../../ui/button";
import { SortHeader } from "../../../ui/sort-header";
import { StatusBadge, statusLabel } from "../../../ui/status-badge";
import type { Plan } from "../api/types";
import { PersonLink } from "./person-link";

const ACCESSORS = {
  start: (p: Plan) => timeValue(p.startDate),
  status: (p: Plan) => p.status,
  origin: (p: Plan) => p.origin,
  updated: (p: Plan) => timeValue(p.updatedAt),
};

export function PlanTable({ plans, onOpen }: { plans: Plan[]; onOpen: (id: string) => void }) {
  const { sorted, sort, toggle } = useSortedItems(plans, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Plans for this child</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Start date" column="start" sort={sort} onSort={toggle} />
            <SortHeader label="Status" column="status" sort={sort} onSort={toggle} />
            <SortHeader label="Origin" column="origin" sort={sort} onSort={toggle} />
            <th scope="col" className="px-4 py-3 font-medium">
              <span className="uppercase tracking-wide">Created by</span>
            </th>
            <SortHeader label="Updated" column="updated" sort={sort} onSort={toggle} />
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((plan) => (
            <tr key={plan.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                {formatDate(plan.startDate)}
              </th>
              <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{statusLabel(plan.origin)}</td>
              <td className="px-4 py-3 text-muted-foreground">{plan.createdById ? <PersonLink id={plan.createdById} /> : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(plan.updatedAt)}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="outline" size="sm" onClick={() => onOpen(plan.id)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
