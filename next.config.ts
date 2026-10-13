import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { assertMockPolicy } from "./src/modules/admin/config/data-source";

export default function nextConfig(phase: string): NextConfig {
  // A production build must not silently ship Admin mock data (plan 0001 §18).
  if (phase === PHASE_PRODUCTION_BUILD) {
    assertMockPolicy({
      source: process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE,
      features: process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES,
      allowMocks: process.env.ALLOW_ADMIN_MOCKS,
      production: true,
    });
  }

  const parentConsoleOn = process.env.NEXT_PUBLIC_ADMIN_PARENT_CONSOLE === "1";

  return {
    // Pin the data-source selectors to concrete values (default: live) so the bundler can fold the checks in
    // features/*/api/index.ts and drop the mock modules from a live build. An unset NEXT_PUBLIC_ variable is
    // not inlined, which would leave the dynamic mock import in the bundle.
    env: {
      NEXT_PUBLIC_ADMIN_DATA_SOURCE: process.env.NEXT_PUBLIC_ADMIN_DATA_SOURCE || "live",
      NEXT_PUBLIC_ADMIN_MOCK_FEATURES: process.env.NEXT_PUBLIC_ADMIN_MOCK_FEATURES || "",
      // parent-console: the temporary Parent test console (plan 0003). "1" enables it. The browser needs the backend
      // origin, so it is derived from the existing API_BASE_URL (no second variable) and exposed only while on.
      NEXT_PUBLIC_ADMIN_PARENT_CONSOLE: parentConsoleOn ? "1" : "",
      NEXT_PUBLIC_ADMIN_PARENT_CONSOLE_API_URL: parentConsoleOn ? process.env.API_BASE_URL || "http://localhost:4000" : "",
    },
  };
}
