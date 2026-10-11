import { describe, expect, it } from "vitest";
import { nextSort, sortItems, timeValue } from "./sort";

type Row = { n: string; t: number | null };
const rows: Row[] = [{ n: "b10", t: 2 }, { n: "B2", t: null }, { n: "a", t: 1 }];
const accessors = { n: (r: Row) => r.n, t: (r: Row) => r.t };

describe("sortItems", () => {
  it("keeps the given order without a sort", () => {
    expect(sortItems(rows, accessors, null)).toEqual(rows);
  });
  it("sorts text naturally and case-insensitively", () => {
    expect(sortItems(rows, accessors, { key: "n", direction: "asc" }).map((r) => r.n)).toEqual(["a", "B2", "b10"]);
    expect(sortItems(rows, accessors, { key: "n", direction: "desc" }).map((r) => r.n)).toEqual(["b10", "B2", "a"]);
  });
  it("puts empty values last in both directions", () => {
    expect(sortItems(rows, accessors, { key: "t", direction: "asc" }).map((r) => r.t)).toEqual([1, 2, null]);
    expect(sortItems(rows, accessors, { key: "t", direction: "desc" }).map((r) => r.t)).toEqual([2, 1, null]);
  });
});

describe("nextSort", () => {
  it("cycles asc, desc, off, and restarts on another column", () => {
    const asc = nextSort(null, "n");
    expect(asc).toEqual({ key: "n", direction: "asc" });
    const desc = nextSort(asc, "n");
    expect(desc).toEqual({ key: "n", direction: "desc" });
    expect(nextSort(desc, "n")).toBeNull();
    expect(nextSort(desc, "t")).toEqual({ key: "t", direction: "asc" });
  });
});

describe("timeValue", () => {
  it("parses dates and rejects junk", () => {
    expect(timeValue("2026-01-01T00:00:00Z")).toBe(Date.UTC(2026, 0, 1));
    expect(timeValue("nope")).toBeNull();
    expect(timeValue(null)).toBeNull();
  });
});
