import { describe, expect, it } from "vitest";
import { founderContent } from "./founder";

function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
}

// The founder profile doc holds private details and unfinished placeholders that
// must never reach the public site.
describe("founderContent", () => {
  const text = strings(founderContent).join("\n");

  it("has no email address or phone number", () => {
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(text).not.toMatch(/\+\s?\d[\d\s]{7,}/);
  });

  it("has no home address, BPS number or tax/legal fields", () => {
    expect(text).not.toMatch(/Byron|Manor Park|Newham|E12/i);
    expect(text).not.toContain("750822");
    expect(text).not.toMatch(/UTR|SIC code|sole trader/i);
  });

  it("has no unfinished [placeholder] text", () => {
    expect(text).not.toMatch(/\[[^\]]*\]/);
  });

  it("does not overclaim professional status", () => {
    expect(text).not.toMatch(/chartered|registered|clinical psychologist/i);
  });
});
