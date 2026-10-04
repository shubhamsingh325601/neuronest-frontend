import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { ADMIN_BASE } from "./paths";

// The public site cannot import admin code, so robots.ts spells "/admin" itself; this keeps the two in sync.
describe("public robots.txt and sitemap", () => {
  it("allows the site but disallows the admin base path", () => {
    expect(robots().rules).toMatchObject({ userAgent: "*", allow: "/", disallow: ADMIN_BASE });
  });

  it("never lists an admin URL", () => {
    expect(sitemap().filter((entry) => /\/admin(\/|$)/i.test(entry.url))).toEqual([]);
  });
});
