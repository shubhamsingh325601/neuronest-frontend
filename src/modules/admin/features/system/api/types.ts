import { z } from "zod";

// GET /v1/health (public): { status, db, uptime (s), timestamp }; HTTP 503 with the same body when the DB is down.
export const healthReportSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  db: z.enum(["up", "down"]),
  uptime: z.number().nonnegative(),
  timestamp: z.string(),
});

export type HealthReport = z.infer<typeof healthReportSchema>;

/**
 * What the System page shows.
 *   operational: API and database up.
 *   degraded:    API answered 503 (it is running, the database is not).
 *   down:        the API could not be reached at all.
 * A 503 is a state, not an error: only an unexpected failure (401, 429, malformed body) rejects.
 */
export interface HealthSnapshot {
  state: "operational" | "degraded" | "down";
  api: "up" | "down";
  database: "up" | "down" | "unknown";
  uptimeSeconds: number | null;
  /** The backend's own timestamp; null when it could not answer. */
  reportedAt: string | null;
}

export interface SystemApi {
  getHealth(signal?: AbortSignal): Promise<HealthSnapshot>;
}
