import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";
export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

type Accessor<T> = (item: T) => string | number | null | undefined;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Empty values always sort last, whichever the direction. */
export function sortItems<T, K extends string>(
  items: readonly T[],
  accessors: Record<K, Accessor<T>>,
  sort: SortState<K> | null,
): T[] {
  if (!sort) return [...items];
  const get = accessors[sort.key];
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = get(a);
    const right = get(b);
    const leftEmpty = left === null || left === undefined || left === "";
    const rightEmpty = right === null || right === undefined || right === "";
    if (leftEmpty || rightEmpty) return Number(leftEmpty) - Number(rightEmpty);
    if (typeof left === "number" && typeof right === "number") return (left - right) * sign;
    return collator.compare(String(left), String(right)) * sign;
  });
}

/** Click cycle on one column: ascending, descending, then back to the server order. */
export function nextSort<K extends string>(current: SortState<K> | null, key: K): SortState<K> | null {
  if (current?.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
}

export function useSortedItems<T, K extends string>(items: readonly T[], accessors: Record<K, Accessor<T>>) {
  const [sort, setSort] = useState<SortState<K> | null>(null);
  // `accessors` is a module-level constant at each call site, so it is safe as a dependency.
  const sorted = useMemo(() => sortItems(items, accessors, sort), [items, accessors, sort]);
  return { sorted, sort, toggle: (key: K) => setSort((current) => nextSort(current, key)) };
}

/** Timestamps compare as numbers; unparsable ones count as empty. */
export function timeValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}
