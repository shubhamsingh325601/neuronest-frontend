import { infiniteQueryOptions, useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { z, type ZodType } from "zod";

// The backend's list envelope: `{ data, nextCursor }`, cursor-only, limit <= 100 (plan 0001 §1). There are no
// page numbers or totals, so lists are "load more".

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export const cursorPageSchema = <T>(item: ZodType<T>): ZodType<CursorPage<T>> =>
  z.object({ data: z.array(item), nextCursor: z.string().nullable() });

export const DEFAULT_PAGE_SIZE = 20;

export interface CursorListConfig<T> {
  queryKey: QueryKey;
  /** One page. `cursor` is undefined for the first page. Feature services pass it as `?cursor=&limit=`. */
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<CursorPage<T>>;
}

export function cursorListOptions<T>({ queryKey, fetchPage }: CursorListConfig<T>) {
  return infiniteQueryOptions({
    queryKey,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Infinite query over a cursor list. `items` is every loaded row, in order. */
export function useCursorList<T>(config: CursorListConfig<T>) {
  const query = useInfiniteQuery(cursorListOptions(config));
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  return { ...query, items };
}
