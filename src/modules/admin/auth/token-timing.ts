// Reads `iat` / `exp` from an access-token JWT purely to schedule the proactive refresh. The token is NOT
// verified here (the backend does that on every call); a malformed value just falls back to `expiresIn`.

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(segment.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

export function readTokenWindow(token: string): { issuedAt: number; expiresAt: number } | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(base64UrlDecode(payload)) as { iat?: unknown; exp?: unknown };
    if (typeof claims.exp !== "number") return null;
    const iat = typeof claims.iat === "number" ? claims.iat : claims.exp - 900;
    return { issuedAt: iat * 1000, expiresAt: claims.exp * 1000 };
  } catch {
    return null;
  }
}

/** Epoch ms at which to refresh: 80% of the token's lifetime. */
export function refreshAtFor(window: { issuedAt: number; expiresAt: number }): number {
  return window.issuedAt + (window.expiresAt - window.issuedAt) * 0.8;
}

export function refreshAtFromExpiresIn(expiresInSeconds: number, now = Date.now()): number {
  return now + expiresInSeconds * 1000 * 0.8;
}
