import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";
import { flattenNav } from "../navigation/nav-config";
import { ADMIN_ROUTES } from "../navigation/paths";
import { filterAndSort, rank } from "./match";
import { ACTIONS } from "./providers/actions";
import { navigationResults } from "./providers/navigation";
import { runSearch } from "./run-search";
import type { SearchProvider, SearchResult } from "./types";

const result = (title: string, extra: Partial<SearchResult> = {}): SearchResult => ({
  id: title,
  title,
  icon: Search,
  href: "/admin",
  keywords: [],
  ...extra,
});

describe("rank / filterAndSort", () => {
  it("matches every word, ignoring case and accents, and ranks prefix before contains before keywords", () => {
    const items = [result("Plan templates"), result("Templates of plans"), result("Children", { keywords: ["template"] })];
    expect(rank(result("Café"), "cafe")).toBe(0);
    expect(filterAndSort(items, "templates").map((r) => r.title)).toEqual(["Templates of plans", "Plan templates"]);
    expect(filterAndSort(items, "template").map((r) => r.title)).toEqual(["Templates of plans", "Plan templates", "Children"]);
    expect(filterAndSort(items, "plan templ").map((r) => r.title)).toEqual(["Plan templates", "Templates of plans"]);
  });

  it("returns nothing for an empty or unmatched query, and keeps the original order on ties", () => {
    expect(filterAndSort([result("A")], "  ")).toEqual([]);
    expect(filterAndSort([result("A")], "zzz")).toEqual([]);
    expect(filterAndSort([result("Alpha"), result("Alps")], "al").map((r) => r.title)).toEqual(["Alpha", "Alps"]);
  });
});

describe("navigation results", () => {
  it("cover every sidebar leaf and point at its href", () => {
    const results = navigationResults();
    expect(results.map((r) => r.href)).toEqual(flattenNav().map((l) => l.href));
    expect(results.find((r) => r.id === "plan-templates")?.keywords).toContain("plan templates");
  });
});

describe("actions", () => {
  it("link to admin routes and have unique ids", () => {
    expect(new Set(ACTIONS.map((a) => a.id)).size).toBe(ACTIONS.length);
    const hrefs = ACTIONS.map((a) => a.href);
    expect(hrefs).toContain(ADMIN_ROUTES.inviteClinician);
    expect(hrefs).toContain(ADMIN_ROUTES.newExpert);
    expect(hrefs).toContain(`${ADMIN_ROUTES.planTemplates}/new`);
    expect(hrefs.every((href) => href.startsWith("/admin/"))).toBe(true);
  });
});

describe("runSearch", () => {
  it("groups results by provider in order and drops empty groups", async () => {
    const groups = await runSearch("expert");
    expect(groups.map((g) => g.providerId)).toEqual(["navigation", "actions"]);
    expect(groups[0].results.map((r) => r.id)).toEqual(["experts"]);
    expect(groups[1].results.map((r) => r.id)).toEqual(["add-expert"]);
    expect((await runSearch("system")).map((g) => g.providerId)).toEqual(["navigation"]);
  });

  it("does nothing for a blank query", async () => {
    expect(await runSearch("   ")).toEqual([]);
  });

  it("skips a provider that fails and awaits async providers", async () => {
    const broken: SearchProvider = { id: "broken", group: "Broken", search: () => Promise.reject(new Error("down")) };
    const slow: SearchProvider = { id: "slow", group: "Slow", search: async () => [result("Hit")] };
    const groups = await runSearch("hit", [broken, slow]);
    expect(groups).toEqual([{ providerId: "slow", group: "Slow", results: [expect.objectContaining({ title: "Hit" })] }]);
  });

  it("rejects when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(runSearch("users", undefined, controller.signal)).rejects.toThrow();
  });
});
