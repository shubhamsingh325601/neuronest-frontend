import { actionsProvider } from "./providers/actions";
import { navigationProvider } from "./providers/navigation";
import type { SearchGroup, SearchProvider } from "./types";

/**
 * Providers in display order. Navigation and actions only: the backend has no search route, and the per-entity
 * `q` filter on /clinicians and /experts is not a global search. An entity provider is added here when one exists.
 */
export const SEARCH_PROVIDERS: readonly SearchProvider[] = [navigationProvider, actionsProvider];

/**
 * Fans a query out to the providers and returns the non-empty groups in provider order. A provider that throws is
 * skipped, so one failing source never blanks the rest; an aborted search rejects.
 */
export async function runSearch(
  query: string,
  providers: readonly SearchProvider[] = SEARCH_PROVIDERS,
  signal?: AbortSignal,
): Promise<SearchGroup[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const settled = await Promise.allSettled(providers.map(async (provider) => provider.search(trimmed, { signal })));
  signal?.throwIfAborted();
  return providers.flatMap((provider, index) => {
    const outcome = settled[index];
    return outcome.status === "fulfilled" && outcome.value.length > 0
      ? [{ providerId: provider.id, group: provider.group, results: outcome.value }]
      : [];
  });
}
