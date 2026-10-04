import { describe, expect, it } from "vitest";
import { assertMockPolicy, mockFeaturesFrom } from "./data-source";

describe("mockFeaturesFrom", () => {
  it("is live by default", () => {
    expect(mockFeaturesFrom({})).toEqual([]);
    expect(mockFeaturesFrom({ source: "live", features: "" })).toEqual([]);
  });

  it("`mock` mocks every feature; a list mocks only those", () => {
    expect(mockFeaturesFrom({ source: "mock" })).toEqual(["dashboard", "system"]);
    expect(mockFeaturesFrom({ features: " system " })).toEqual(["system"]);
  });

  it("rejects typos loudly", () => {
    expect(() => mockFeaturesFrom({ source: "fake" })).toThrow(/live.*mock/);
    expect(() => mockFeaturesFrom({ features: "dashboard,nope" })).toThrow(/nope/);
  });
});

describe("assertMockPolicy (production build guard)", () => {
  it("refuses mock sources in production without ALLOW_ADMIN_MOCKS=1", () => {
    expect(() => assertMockPolicy({ source: "mock", production: true })).toThrow(/ALLOW_ADMIN_MOCKS/);
    expect(() => assertMockPolicy({ features: "system", production: true, allowMocks: "true" })).toThrow();
  });

  it("allows them with the explicit opt-in, and always allows live or development", () => {
    expect(() => assertMockPolicy({ source: "mock", production: true, allowMocks: "1" })).not.toThrow();
    expect(() => assertMockPolicy({ production: true })).not.toThrow();
    expect(() => assertMockPolicy({ source: "mock", production: false })).not.toThrow();
  });
});
