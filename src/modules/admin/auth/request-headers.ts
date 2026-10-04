/** Request header the proxy sets to the browser-visible path + query (overwriting any client-supplied value). */
export const NEXT_PATH_HEADER = "x-nn-path";

/** Custom header every BFF / refresh call must carry. Browsers cannot send it cross-origin without a CORS preflight. */
export const CSRF_HEADER = "x-nn-admin";
export const CSRF_VALUE = "1";

/** Per-request CSP nonce, set by the proxy for `/admin/*` and read by the admin root layout. */
export const NONCE_HEADER = "x-nonce";
