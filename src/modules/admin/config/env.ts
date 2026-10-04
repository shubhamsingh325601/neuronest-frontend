import "server-only";
import { z } from "zod";

// Server-side configuration for the Admin app, validated on first use (not at import) so `next build`
// works without a backend. Names are documented in .env.example and docs/data-layer.md.
const schema = z.object({
  // The backend ORIGIN, without `/v1` (the spec paths already include it), e.g. http://localhost:4000.
  API_BASE_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url({ protocol: /^https?$/ })
      .refine((value) => new URL(value).pathname === "/", "API_BASE_URL must be an origin without a path (no /v1).")
      .optional(),
  ),
});

export interface AdminEnv {
  /** Backend origin, no trailing slash. */
  apiBaseUrl: string;
  production: boolean;
}

const DEV_API_BASE_URL = "http://localhost:4000";

export function getAdminEnv(source: Record<string, string | undefined> = process.env): AdminEnv {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid Admin environment: ${issues}`);
  }
  const production = source.NODE_ENV === "production";
  const apiBaseUrl = parsed.data.API_BASE_URL;
  if (!apiBaseUrl && production) throw new Error("Invalid Admin environment: API_BASE_URL is required in production.");

  return {
    apiBaseUrl: (apiBaseUrl ?? DEV_API_BASE_URL).replace(/\/$/, ""),
    production,
  };
}
