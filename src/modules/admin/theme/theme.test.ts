import { describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, isThemePreference, resolveTheme, themeInitScript } from "./theme";

describe("resolveTheme", () => {
  it("honours an explicit preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system for 'system'", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("isThemePreference", () => {
  it("accepts only the three modes", () => {
    expect(["light", "dark", "system"].every(isThemePreference)).toBe(true);
    expect(isThemePreference("auto")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe("themeInitScript", () => {
  type Env = { stored: string | null; systemDark: boolean };

  function run({ stored, systemDark }: Env) {
    const classes = new Set<string>();
    const root = {
      classList: { toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)) },
      style: { colorScheme: "" },
    };
    const localStorage = { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) };
    const window = { matchMedia: () => ({ matches: systemDark }) };
    new Function("localStorage", "window", "document", themeInitScript)(localStorage, window, {
      documentElement: root,
    });
    return { dark: classes.has("dark"), colorScheme: root.style.colorScheme };
  }

  it("applies the stored preference before paint", () => {
    expect(run({ stored: "dark", systemDark: false })).toEqual({ dark: true, colorScheme: "dark" });
    expect(run({ stored: "light", systemDark: true })).toEqual({ dark: false, colorScheme: "light" });
  });

  it("falls back to the system when nothing valid is stored", () => {
    expect(run({ stored: null, systemDark: true }).dark).toBe(true);
    expect(run({ stored: "garbage", systemDark: false }).dark).toBe(false);
    expect(run({ stored: "system", systemDark: true }).dark).toBe(true);
  });

  it("never throws when storage is blocked", () => {
    const blocked = () => {
      throw new Error("blocked");
    };
    expect(() =>
      new Function("localStorage", "window", "document", themeInitScript)(
        { getItem: blocked },
        {},
        { documentElement: {} },
      ),
    ).not.toThrow();
  });
});
