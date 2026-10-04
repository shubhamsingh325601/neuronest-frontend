import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BREADCRUMB_ROUTES, resolveBreadcrumbs } from "./breadcrumbs/registry";
import { NAV_GROUPS, findActiveLeaf, flattenNav, isNavParent } from "./nav-config";
import { isPathActive, normalizeAdminPath } from "./paths";

const consoleDir = fileURLToPath(new URL("../../../app/(admin)/admin/(console)", import.meta.url));

describe("normalizeAdminPath", () => {
  it("strips the internal /admin prefix and trailing slashes", () => {
    expect(normalizeAdminPath("/admin")).toBe("/");
    expect(normalizeAdminPath("/admin/users")).toBe("/users");
    expect(normalizeAdminPath("/users/")).toBe("/users");
    expect(normalizeAdminPath("/")).toBe("/");
  });

  it("does not strip look-alike segments", () => {
    expect(normalizeAdminPath("/administrators")).toBe("/administrators");
  });
});

describe("isPathActive", () => {
  it("matches the root exactly only", () => {
    expect(isPathActive("/", "/")).toBe(true);
    expect(isPathActive("/", "/users")).toBe(false);
  });

  it("matches by whole segments", () => {
    expect(isPathActive("/users", "/users")).toBe(true);
    expect(isPathActive("/users", "/users/42")).toBe(true);
    expect(isPathActive("/users", "/users-archive")).toBe(false);
    expect(isPathActive("/users", "/admin/users")).toBe(true);
  });

  it("keeps sibling children distinct", () => {
    expect(isPathActive("/clinicians", "/clinicians/abc")).toBe(true);
    expect(isPathActive("/clinicians/abc", "/clinicians")).toBe(false);
  });
});

describe("nav config", () => {
  const leaves = flattenNav();

  it("has unique ids and hrefs", () => {
    expect(new Set(leaves.map((l) => l.id)).size).toBe(leaves.length);
    expect(new Set(leaves.map((l) => l.href)).size).toBe(leaves.length);
  });

  it("gives every nav route a page (no dead links)", () => {
    for (const { href } of leaves) {
      const dir = href === "/" ? consoleDir : `${consoleDir}/${href.slice(1)}`;
      expect(existsSync(`${dir}/page.tsx`), href).toBe(true);
    }
  });

  it("keeps parent children under the parent prefix", () => {
    for (const group of NAV_GROUPS)
      for (const item of group.items)
        if (isNavParent(item)) for (const child of item.children) expect(child.href.startsWith(item.prefix)).toBe(true);
  });

  it("has a breadcrumb for every nav route", () => {
    const patterns = new Set(BREADCRUMB_ROUTES.map((r) => r.pattern));
    for (const { href } of leaves) expect(patterns.has(href), href).toBe(true);
  });
});

describe("resolveBreadcrumbs", () => {
  it("returns the trail from the root, marking the current page", () => {
    expect(resolveBreadcrumbs("/clinicians")).toEqual([
      { label: "Dashboard", href: "/", current: false },
      { label: "Clinicians", href: "/clinicians", current: true },
    ]);
  });

  it("accepts the internal /admin form", () => {
    expect(resolveBreadcrumbs("/admin/users").map((c) => c.label)).toEqual(["Dashboard", "Users"]);
  });

  it("is a single crumb at the root and empty for unknown paths", () => {
    expect(resolveBreadcrumbs("/")).toEqual([{ label: "Dashboard", href: "/", current: true }]);
    expect(resolveBreadcrumbs("/nope/nothing")).toEqual([]);
  });

  it("only references registered parents", () => {
    const patterns = new Set(BREADCRUMB_ROUTES.map((r) => r.pattern));
    for (const route of BREADCRUMB_ROUTES) if (route.parent) expect(patterns.has(route.parent)).toBe(true);
  });
});

describe("findActiveLeaf", () => {
  it("picks the most specific leaf", () => {
    expect(findActiveLeaf("/clinicians")?.id).toBe("clinicians");
    expect(findActiveLeaf("/clinicians/abc")?.id).toBe("clinicians");
    expect(findActiveLeaf("/plan-templates/new")?.id).toBe("plan-templates");
  });

  it("returns nothing for paths outside the nav", () => {
    expect(findActiveLeaf("/profile")).toBeUndefined();
    expect(findActiveLeaf("/")?.id).toBe("dashboard");
  });
});
