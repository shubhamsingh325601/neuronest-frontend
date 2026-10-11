import type { SearchResult } from "./types";

const normalise = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Relevance of `result` for `query`, or null when it does not match. Every word of the query must appear in the
 * title, subtitle or keywords; a title that starts with the query ranks first, then a title containing it, then
 * the rest. Lower is better.
 */
export function rank(result: SearchResult, query: string): number | null {
  const needle = normalise(query);
  if (!needle) return null;
  const title = normalise(result.title);
  const haystack = [title, normalise(result.subtitle ?? ""), ...result.keywords.map(normalise)].join(" ");
  if (!needle.split(" ").every((word) => haystack.includes(word))) return null;
  if (title.startsWith(needle)) return 0;
  if (title.includes(needle)) return 1;
  return 2;
}

export function filterAndSort(results: SearchResult[], query: string): SearchResult[] {
  return results
    .map((result, index) => ({ result, index, score: rank(result, query) }))
    .filter((entry): entry is typeof entry & { score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.result);
}
