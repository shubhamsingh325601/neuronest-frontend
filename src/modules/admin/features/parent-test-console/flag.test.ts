import { afterEach, describe, expect, it, vi } from "vitest";
import { isParentConsoleEnabled, parentConsoleApiOrigin, parentConsoleConnectSrc } from "./flag";

afterEach(() => vi.unstubAllEnvs());

describe("isParentConsoleEnabled", () => {
  it("is off unless the variable is exactly 1", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "");
    expect(isParentConsoleEnabled()).toBe(false);
    for (const value of ["0", "true", "yes", "1 "]) {
      vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", value);
      expect(isParentConsoleEnabled(), value).toBe(false);
    }
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "1");
    expect(isParentConsoleEnabled()).toBe(true);
  });
});

describe("parentConsoleApiOrigin", () => {
  it("returns the origin and drops any path or trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", "https://api.example.com/v1/");
    expect(parentConsoleApiOrigin()).toBe("https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", "http://localhost:4000");
    expect(parentConsoleApiOrigin()).toBe("http://localhost:4000");
  });

  it("is null when unset, malformed or not http(s)", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", "");
    expect(parentConsoleApiOrigin()).toBeNull();
    for (const value of ["not a url", "ftp://host", "javascript:alert(1)", "//host"]) {
      vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", value);
      expect(parentConsoleApiOrigin(), value).toBeNull();
    }
  });
});

describe("parentConsoleConnectSrc", () => {
  it("adds the origin only while the console is on", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", "http://localhost:4000");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "");
    expect(parentConsoleConnectSrc()).toEqual([]);
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "1");
    expect(parentConsoleConnectSrc()).toEqual(["http://localhost:4000"]);
  });

  it("adds nothing when the console is on but the URL is unusable", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE", "1");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL", "nope");
    expect(parentConsoleConnectSrc()).toEqual([]);
  });
});
