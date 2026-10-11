import type { LucideIcon } from "lucide-react";

// The only thing the command palette (a later M5 item) knows about search. Plan 0001 §12.

export interface SearchResult {
  /** Unique within its provider. */
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Navigate here when chosen. */
  href: string;
  /** Extra words that should find this result (not shown). */
  keywords: string[];
}

export interface SearchContext {
  signal?: AbortSignal;
}

export interface SearchProvider {
  id: string;
  /** Heading the palette shows these results under. */
  group: string;
  /** Sync for local providers; async for one that calls the backend. Called with a non-empty, trimmed query. */
  search(query: string, context: SearchContext): SearchResult[] | Promise<SearchResult[]>;
}

export interface SearchGroup {
  providerId: string;
  group: string;
  results: SearchResult[];
}
