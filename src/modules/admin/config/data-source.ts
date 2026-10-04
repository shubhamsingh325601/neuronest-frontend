// Which Admin features read mock data instead of the live backend (plan 0001 §18).
//
//   NEXT_PUBLIC_ADMIN_DATA_SOURCE=live|mock          default live; `mock` mocks every feature
//   NEXT_PUBLIC_ADMIN_MOCK_FEATURES=dashboard,system mock only these (a comma list)
//   ALLOW_ADMIN_MOCKS=1                              required for a PRODUCTION build to contain mock sources
//
// Both selectors are NEXT_PUBLIC_ because feature hooks run in the browser and Next inlines the value at build
// time; that is also what lets the bundler drop the dynamic `import("@/mocks/...")` from live builds. No
// secret may ever be put in these. This file has no server-only or browser-only code: next.config.ts imports it
// to refuse a production build that would ship mocks.

export const ADMIN_FEATURES = ["dashboard", "system"] as const;
export type AdminFeature = (typeof ADMIN_FEATURES)[number];

const FEATURE_LABELS: Record<AdminFeature, string> = {
  dashboard: "Dashboard",
  system: "System",
};

export interface DataSourceEnv {
  source?: string;
  features?: string;
}

function parseFeatureList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

/** The features that use mock data under `env`. Throws on a value that is a typo, so a mistake is loud. */
export function mockFeaturesFrom(env: DataSourceEnv): AdminFeature[] {
  const source = (env.source ?? "").trim();
  if (source !== "" && source !== "live" && source !== "mock") {
    throw new Error(`NEXT_PUBLIC_ADMIN_DATA_SOURCE must be "live" or "mock" (got "${source}").`);
  }
  const named = parseFeatureList(env.features);
  const unknown = named.filter((name) => !(ADMIN_FEATURES as readonly string[]).includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `NEXT_PUBLIC_ADMIN_MOCK_FEATURES has unknown feature(s): ${unknown.join(", ")}. Known: ${ADMIN_FEATURES.join(", ")}.`,
    );
  }
  if (source === "mock") return [...ADMIN_FEATURES];
  return ADMIN_FEATURES.filter((feature) => named.includes(feature));
}

/**
 * Throws when a production build would contain mock sources without an explicit ALLOW_ADMIN_MOCKS=1.
 * Called from next.config.ts at build time.
 */
export function assertMockPolicy(env: DataSourceEnv & { allowMocks?: string; production: boolean }): void {
  const mocked = mockFeaturesFrom(env);
  if (env.production && mocked.length > 0 && env.allowMocks !== "1") {
    throw new Error(
      `Refusing to build Admin with mock data (${mocked.join(", ")}). Unset NEXT_PUBLIC_ADMIN_DATA_SOURCE / ` +
        "NEXT_PUBLIC_ADMIN_MOCK_FEATURES, or set ALLOW_ADMIN_MOCKS=1 for a demo build.",
    );
  }
}

// Read literally so Next can inline them at build time.
const publicEnv: DataSourceEnv = {
  source: process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE,
  features: process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES,
};

/** False in a live build, which lets the bundler drop every mock import behind it. */
export const MOCKS_POSSIBLE =
  process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE === "mock" || (process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES ?? "") !== "";

export function isMockFeature(feature: AdminFeature): boolean {
  return MOCKS_POSSIBLE && mockFeaturesFrom(publicEnv).includes(feature);
}

/** Human labels of the mocked features, for the MockDataChip. */
export function mockFeatureLabels(): string[] {
  return MOCKS_POSSIBLE ? mockFeaturesFrom(publicEnv).map((feature) => FEATURE_LABELS[feature]) : [];
}
