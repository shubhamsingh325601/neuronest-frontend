import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Public (landing) and Admin code are separate trees. The only module they share is `@/lib/utils`.
// See docs/plans/0001-admin-app.md §5.
const publicBoundary = {
  files: [
    "src/app/(public)/**",
    "src/app/*.{ts,tsx}",
    "src/components/**",
    "src/content/**",
    "src/lib/**",
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/modules/admin", "@/modules/admin/**", "@/mocks", "@/mocks/**", "@/app/(admin)/**"],
            message: "Public code must not import Admin code. The Admin app is isolated (plan 0001 §5).",
          },
        ],
      },
    ],
  },
};

const adminBoundary = {
  files: ["src/app/(admin)/**", "src/modules/admin/**", "src/mocks/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@/components",
              "@/components/**",
              "@/content",
              "@/content/**",
              "@/app/(public)/**",
              "@/app/actions",
              "@/lib/*",
              "!@/lib/utils",
            ],
            message:
              "Admin code must not import landing code. The only shared module is @/lib/utils (plan 0001 §5).",
          },
        ],
      },
    ],
  },
};

// Admin colours come only from semantic tokens (bg-background, text-muted-foreground, ...) defined in
// admin.css. No hex / rgb() / hsl() / oklch() literals, no arbitrary colour classes, no Tailwind palette
// classes (bg-red-500). black / white are allowed for scrims. See plan 0001 §8.
const COLOUR_UTILITIES =
  "(?:bg|text|border|border-[xytblrse]|ring|ring-offset|outline|fill|stroke|from|via|to|shadow|divide|decoration|accent|caret|placeholder)";
const PALETTE =
  "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const colourPatterns = [
  ["hex colour", "#[0-9a-fA-F]{3,4}(?![0-9a-zA-Z])|#[0-9a-fA-F]{6}(?![0-9a-zA-Z])|#[0-9a-fA-F]{8}(?![0-9a-zA-Z])"],
  ["colour function", "\\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\\("],
  ["arbitrary colour class", `\\b${COLOUR_UTILITIES}-\\[(?:#|rgb|hsl|oklch|oklab|lab|lch|hwb|color:|var\\(--color)`],
  ["palette colour class", `\\b${COLOUR_UTILITIES}-${PALETTE}-\\d{2,3}\\b`],
];
const adminColours = {
  files: ["src/app/(admin)/**/*.{ts,tsx}", "src/modules/admin/**/*.{ts,tsx}", "src/mocks/**/*.{ts,tsx}"],
  ignores: ["**/*.test.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "error",
      ...colourPatterns.flatMap(([label, pattern]) => [
        {
          selector: `Literal[value=/${pattern.replace(/\//g, "\\/")}/]`,
          message: `Admin code must use semantic colour tokens, not a ${label} (plan 0001 §8).`,
        },
        {
          selector: `TemplateElement[value.raw=/${pattern.replace(/\//g, "\\/")}/]`,
          message: `Admin code must use semantic colour tokens, not a ${label} (plan 0001 §8).`,
        },
      ]),
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  publicBoundary,
  adminBoundary,
  adminColours,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "index_new/**",
    "public/**",
  ]),
]);

export default eslintConfig;
