// Content Security Policy for `/admin/*` (plan 0002 §8). Admin shares an origin with the landing site, so this
// limits what injected markup can do on admin pages. Per request nonce; Next.js applies it to its own scripts
// when the page is dynamically rendered (the admin root layout is `force-dynamic`).
//
// - script-src: nonce + 'strict-dynamic' only. No 'unsafe-inline'. Dev adds 'unsafe-eval' (React debugging).
// - style-src keeps 'unsafe-inline': React/Radix/sonner set `style=""` attributes, which nonces cannot cover.
//   Inline styles cannot run script; this is the usual trade-off.
// - Nothing third-party: fonts are self-hosted by next/font, icons are inline SVG.

export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

export function buildAdminCsp(nonce: string, development = false): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Dev: the HMR websocket.
    `connect-src 'self'${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}
