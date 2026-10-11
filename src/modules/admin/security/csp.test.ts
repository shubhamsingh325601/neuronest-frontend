import { describe, expect, it } from "vitest";
import { buildAdminCsp, createNonce } from "./csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `));

describe("buildAdminCsp", () => {
  const csp = buildAdminCsp("abc123");

  it("allows scripts only by nonce (strict-dynamic), never unsafe-inline or unsafe-eval in production", () => {
    const script = directive(csp, "script-src");
    expect(script).toBe("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(script).not.toContain("unsafe-inline");
  });

  it("adds unsafe-eval and websockets in development only", () => {
    const dev = buildAdminCsp("abc123", true);
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toContain("ws:");
    expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
  });

  it("blocks framing, plugins, foreign form targets and base-tag injection; loads nothing third-party beyond the media CDN", () => {
    for (const d of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "default-src 'self'", "font-src 'self'"]) {
      expect(csp).toContain(d);
    }
    // The only external host is the media CDN, and only for images and media (never scripts, styles or connections).
    expect([...csp.matchAll(/https?:\/\/[^\s;]+/g)].map((m) => m[0])).toEqual(["https://res.cloudinary.com", "https://res.cloudinary.com"]);
    expect(directive(csp, "img-src")).toContain("https://res.cloudinary.com");
    expect(directive(csp, "media-src")).toBe("media-src 'self' https://res.cloudinary.com");
    for (const name of ["script-src", "style-src", "connect-src", "font-src", "default-src"]) expect(directive(csp, name)).not.toMatch(/https?:/);
  });
});

describe("createNonce", () => {
  it("is unique per call and header-safe", () => {
    const a = createNonce();
    expect(a).not.toBe(createNonce());
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});
