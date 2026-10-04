import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Reads the real tokens from admin.css so the test cannot drift from the shipped values.
const css = readFileSync(fileURLToPath(new URL("../styles/admin.css", import.meta.url)), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Missing ${selector} block in admin.css`);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("\n}", start));
  const tokens: Record<string, string> = {};
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[match[1]] = match[2].trim();
  return tokens;
}

const themes = { light: block(":root"), dark: block(".dark") };

type Rgb = [number, number, number];

function oklchToRgb(value: string): Rgb {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(value);
  if (!m) throw new Error(`Not an oklch() colour: ${value}`);
  const [L, C, h] = [Number(m[1]), Number(m[2]), (Number(m[3]) * Math.PI) / 180];
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  // Linear sRGB, clamped (out-of-gamut values are clipped as browsers do).
  const lin: Rgb = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s,
  ];
  return lin.map((c) => Math.min(1, Math.max(0, c))) as Rgb;
}

function luminance(value: string): number {
  const [r, g, b] = oklchToRgb(value);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground token, background token, minimum ratio]. 4.5 = AA for text; 3 = AA for UI components.
const TEXT_PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["info-foreground", "info"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-accent-foreground", "sidebar-accent"],
  ["brand-panel-foreground", "brand-panel"],
  ["brand-panel-muted", "brand-panel"],
  // Links and focus-adjacent text in the brand colour.
  ["primary", "background"],
  ["primary", "card"],
  // Badge text (tone colour directly on the card / page).
  ["destructive", "card"],
  ["success", "card"],
  ["warning", "card"],
  ["info", "card"],
  ["destructive", "background"],
  // Toast tone text sits on the popover.
  ["success", "popover"],
  ["warning", "popover"],
  ["info", "popover"],
  ["destructive", "popover"],
];

const UI_PAIRS: [string, string][] = [
  ["ring", "background"],
  ["sidebar-ring", "sidebar"],
];

describe.each(Object.entries(themes))("admin tokens (%s)", (_name, tokens) => {
  it.each(TEXT_PAIRS)("%s on %s meets AA text contrast (4.5:1)", (fg, bg) => {
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("%s on %s meets AA component contrast (3:1)", (fg, bg) => {
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(3);
  });
});

describe("admin token structure", () => {
  it("defines the same tokens in light and dark", () => {
    // `radius` is theme-independent and only lives in :root.
    const colours = (t: Record<string, string>) => Object.keys(t).filter((k) => k !== "radius").sort();
    expect(colours(themes.dark)).toEqual(colours(themes.light));
  });

  it("exposes every colour token through @theme inline", () => {
    const theme = css.slice(css.indexOf("@theme inline"));
    for (const name of Object.keys(themes.light)) {
      if (name === "radius") continue;
      expect(theme, `--color-${name}`).toContain(`--color-${name}: var(--${name});`);
    }
  });
});
