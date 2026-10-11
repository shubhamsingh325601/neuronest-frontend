import { flattenNav } from "../../navigation/nav-config";
import { filterAndSort } from "../match";
import type { SearchProvider, SearchResult } from "../types";

/** Every page in the sidebar. Derived from the nav config, so a new nav item is searchable with no extra work. */
export function navigationResults(): SearchResult[] {
  return flattenNav().map((leaf) => ({
    id: leaf.id,
    title: leaf.label,
    icon: leaf.icon,
    href: leaf.href,
    keywords: [leaf.id.replace(/-/g, " ")],
  }));
}

export const navigationProvider: SearchProvider = {
  id: "navigation",
  group: "Go to",
  search: (query) => filterAndSort(navigationResults(), query),
};
