import { describe, expect, it } from "vitest";
import { expiryLevel, formatCountdown, secondsRemaining } from "./countdown";

describe("secondsRemaining", () => {
  it("rounds up and never goes negative", () => {
    expect(secondsRemaining(10_000, 0)).toBe(10);
    expect(secondsRemaining(10_001, 0)).toBe(11);
    expect(secondsRemaining(10_000, 10_000)).toBe(0);
    expect(secondsRemaining(10_000, 99_999)).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formats mm:ss and h:mm:ss", () => {
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(9)).toBe("00:09");
    expect(formatCountdown(65)).toBe("01:05");
    expect(formatCountdown(3599)).toBe("59:59");
    expect(formatCountdown(3600)).toBe("1:00:00");
    expect(formatCountdown(3725)).toBe("1:02:05");
    expect(formatCountdown(-4)).toBe("00:00");
  });
});

describe("expiryLevel", () => {
  it("is ok above 5 minutes, warning below, expired at zero", () => {
    expect(expiryLevel(3600)).toBe("ok");
    expect(expiryLevel(300)).toBe("ok");
    expect(expiryLevel(299)).toBe("warning");
    expect(expiryLevel(1)).toBe("warning");
    expect(expiryLevel(0)).toBe("expired");
  });
});
