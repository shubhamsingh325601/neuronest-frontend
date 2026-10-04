import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BREADCRUMB_ROUTES, resolveBreadcrumbs } from "./breadcrumbs/registry";
import { NAV_GROUPS, findActiveLeaf, flattenNav, isNavParent } from "./nav-config";
import { ADMIN_BASE, adminPath, isAdminPath, isPathActive } from "./paths";

const consoleDir = fileURLToPath(new URL("../../../app/(admin)/admin/(console)", import.meta.url));

describe("adminPath / isAdminPath", () => {
  it("builds full admin paths", () => {
    expect(adminPath()).toBe("/admin");
    expect(adminPath("/users")).toBe("/admin/users");
    expect(adminPath("/users?role=PARENT")).toBe("/admin/users?role=PARENT");
  });

  it("recognises /admin and anything under it, on whole segments, however it is spelled", () => {
    for (const path of ["/admin", "/admin/", "/admin/users", "/ADMIN/users", "//admin/users", "/%61dmin/users", "/admin/api/backend/x"])
      expect(isAdminPath(path), path).toBe(true);
    for (const path of ["/", "/faq", "/adminx", "/administrators", "/admin-panel", "/x/admin"]) expect(isAdminPath(path), path).toBe(false);
  });
});

describe("isPathActive", () => {
  it("matches the root exactly only", () => {
    expect(isPathActive("/admin", "/admin")).toBe(true);
    expect(isPathActive("/admin", "/admin/users")).toBe(false);
  });

  it("matches by whole segments", () => {
    expect(isPathActive("/admin/users", "/admin/users")).toBe(true);
    expect(isPathActive("/admin/users", "/admin/users/42")).toBe(true);
    expect(isPathActive("/admin/users", "/admin/users-archive")).toBe(false);
    expect(isPathActive("/admin/users", "/admin/users/")).toBe(true);
  });

  it("keeps sibling children distinct", () => {
    expect(isPathActive("/admin/clinicians", "/admin/clinicians/abc")).toBe(true);
    expect(isPathActive("/admin/clinicians/abc", "/admin/clinicians")).toBe(false);
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
      const dir = href === ADMIN_BASE ? consoleDir : `${consoleDir}/${href.slice(ADMIN_BASE.length + 1)}`;
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
    expect(resolveBreadcrumbs("/admin/clinicians")).toEqual([
      { label: "Dashboard", href: "/admin", current: false },
      { label: "Clinicians", href: "/admin/clinicians", current: true },
    ]);
  });

  it("ignores a trailing slash", () => {
    expect(resolveBreadcrumbs("/admin/users/").map((c) => c.label)).toEqual(["Dashboard", "Users"]);
  });

  it("is a single crumb at the root and empty for unknown paths", () => {
    expect(resolveBreadcrumbs("/admin")).toEqual([{ label: "Dashboard", href: "/admin", current: true }]);
    expect(resolveBreadcrumbs("/admin/nope/nothing")).toEqual([]);
  });

  it("only references registered parents", () => {
    const patterns = new Set(BREADCRUMB_ROUTES.map((r) => r.pattern));
    for (const route of BREADCRUMB_ROUTES) if (route.parent) expect(patterns.has(route.parent)).toBe(true);
  });
});

describe("findActiveLeaf", () => {
  it("picks the most specific leaf", () => {
    expect(findActiveLeaf("/admin/clinicians")?.id).toBe("clinicians");
    expect(findActiveLeaf("/admin/clinicians/abc")?.id).toBe("clinicians");
    expect(findActiveLeaf("/admin/plan-templates/new")?.id).toBe("plan-templates");
  });

  it("returns nothing for paths outside the nav", () => {
    expect(findActiveLeaf("/admin/profile")).toBeUndefined();
    expect(findActiveLeaf("/admin")?.id).toBe("dashboard");
  });
});
