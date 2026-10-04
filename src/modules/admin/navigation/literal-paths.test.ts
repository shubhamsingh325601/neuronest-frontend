import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Admin shares an origin with the landing site, so a link or redirect written without the `/admin` prefix
// would silently land on the landing 404. Admin code builds URLs from `navigation/paths.ts`; this catches a
// hand-written root-relative literal that bypasses it.

const roots = [
  fileURLToPath(new URL("../../../", import.meta.url)) + "modules/admin",
  fileURLToPath(new URL("../../../", import.meta.url)) + "app/(admin)",
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

// href="/x", href: "/x", redirect("/x"), navigate("/x"), location.assign("/x"), fetch("/x"), router.push("/x"), actionHref="/x"
const LITERAL = /(?:href\s*[=:]\s*\{?|redirect\(|navigate\(|assign\(|fetch\(|push\(|replace\()\s*[`"'](\/[^`"'$]*)/g;

describe("admin URL literals", () => {
  it("never hand-write a root-relative path outside /admin", () => {
    const offenders: string[] = [];
    for (const file of roots.flatMap(sourceFiles)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(LITERAL)) {
        const path = match[1];
        if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?")) continue;
        offenders.push(`${file.split(/[\\/]src[\\/]/)[1]}: ${match[0].trim()}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
