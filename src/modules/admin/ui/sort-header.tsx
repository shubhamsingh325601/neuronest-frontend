import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortState } from "../lib/sort";

interface SortHeaderProps<K extends string> {
  label: string;
  column: K;
  sort: SortState<K> | null;
  onSort: (column: K) => void;
}

/** A sortable `<th>`: the button carries the action, `aria-sort` carries the state. */
export function SortHeader<K extends string>({ label, column, sort, onSort }: SortHeaderProps<K>) {
  const active = sort?.key === column ? sort.direction : null;
  const Icon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <th
      scope="col"
      aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : "none"}
      className="px-4 py-3 font-medium"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 uppercase tracking-wide hover:text-foreground"
      >
        {label}
        <Icon aria-hidden="true" className={active ? "size-3.5 text-foreground" : "size-3.5 opacity-50"} />
      </button>
    </th>
  );
}
