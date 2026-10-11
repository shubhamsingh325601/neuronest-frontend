import { afterEach, describe, expect, it, vi } from "vitest";
import { originFromHeaders } from "../../lib/callback-url";
import { formatAge } from "./age";

describe("formatAge", () => {
  const now = new Date("2026-10-10T12:00:00Z");
  it("uses months under two years and years after", () => {
    expect(formatAge("2026-09-01", now)).toBe("1 month");
    expect(formatAge("2025-04-01", now)).toBe("18 months");
    expect(formatAge("2021-10-11", now)).toBe("4 years");
    expect(formatAge("2021-10-10", now)).toBe("5 years");
  });
  it("is a dash for an unusable date", () => {
    expect(formatAge("nope", now)).toBe("—");
    expect(formatAge("2027-01-01", now)).toBe("—");
  });
});

describe("originFromHeaders", () => {
  const headers = (map: Record<string, string>) => (name: string) => map[name] ?? null;
  afterEach(() => vi.restoreAllMocks());

  it("prefers the forwarded host and protocol", () => {
    expect(originFromHeaders(headers({ "x-forwarded-host": "app.example.com", "x-forwarded-proto": "https", host: "internal:3000" }))).toBe(
      "https://app.example.com",
    );
  });
  it("defaults to http on localhost and https elsewhere", () => {
    expect(originFromHeaders(headers({ host: "localhost:3000" }))).toBe("http://localhost:3000");
    expect(originFromHeaders(headers({ host: "app.example.com" }))).toBe("https://app.example.com");
  });
  it("rejects a malformed host", () => {
    expect(originFromHeaders(headers({ host: "evil.com/path" }))).toBeUndefined();
    expect(originFromHeaders(headers({}))).toBeUndefined();
  });
});
