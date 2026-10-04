import type { ZodType } from "zod";
import { ApiError, ErrorCode, parseApiError } from "./api-errors";

// The single HTTP core for the Admin app. Both callers sit on it:
//   server  -> backend   (lib/server-api.ts: base URL, bearer)
//   browser -> BFF       (lib/api-client.ts: same-origin, CSRF header, refresh-and-retry)
// Transports only decide WHERE and HOW a request is sent. Everything else is identical on both sides:
// verbs, query serialisation, JSON + empty-body handling, optional schema validation, and turning every
// failure into an ApiError. Components, stores and services therefore never parse a Response themselves.

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Primitive = string | number | boolean;
export type QueryValue = Primitive | null | undefined | readonly Primitive[];
export type Query = Record<string, QueryValue>;

export interface RequestOptions<T = unknown> {
  query?: Query;
  /** JSON-serialisable body. Send only documented fields: the backend rejects unknown ones. */
  body?: unknown;
  signal?: AbortSignal;
  /**
   * Validates and types the response. Use it for anything the UI depends on; a mismatch becomes
   * ApiError(BAD_BACKEND_RESPONSE) instead of an undefined-property crash later.
   */
  schema?: ZodType<T>;
}

export interface TransportRequest {
  method: HttpMethod;
  /** Path relative to the API root, no leading slash needed (e.g. `users/42`). */
  path: string;
  /** Already serialised: empty or starting with `?`. */
  search: string;
  /** Already serialised JSON, or undefined. */
  body: string | undefined;
  signal: AbortSignal | undefined;
}

/** Sends the request and returns the raw Response. Must throw ApiError (never a bare Error) on network failure. */
export type Transport = (request: TransportRequest) => Promise<Response>;

/** `{ a: 1, b: [x, y], c: undefined }` -> `?a=1&b=x&b=y`. Skips null / undefined / empty strings. */
export function buildQuery(query: Query | undefined): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === undefined || item === null || item === "") continue;
      params.append(key, String(item));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

const badResponse = (detail: string) => new ApiError({ status: 502, code: ErrorCode.BadResponse, detail });

/** Response -> data. Throws ApiError for non-2xx, an unreadable body or a schema mismatch. 204 / empty -> undefined. */
export async function readResponse<T>(response: Response, schema?: ZodType<T>): Promise<T> {
  if (!response.ok) throw await parseApiError(response);

  let data: unknown;
  if (response.status !== 204) {
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      throw badResponse("The service returned an unreadable response.");
    }
  }
  if (!schema) return data as T;

  const result = schema.safeParse(data);
  if (!result.success) throw badResponse("The service returned an unexpected response.");
  return result.data;
}

export interface HttpClient {
  request<T = unknown>(method: HttpMethod, path: string, options?: RequestOptions<T>): Promise<T>;
  get<T = unknown>(path: string, options?: Omit<RequestOptions<T>, "body">): Promise<T>;
  post<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  put<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  patch<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
  delete<T = unknown>(path: string, options?: RequestOptions<T>): Promise<T>;
}

export function createHttpClient(transport: Transport): HttpClient {
  async function request<T>(method: HttpMethod, path: string, options: RequestOptions<T> = {}): Promise<T> {
    const response = await transport({
      method,
      path: path.replace(/^\/+/, ""),
      search: buildQuery(options.query),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
    return readResponse(response, options.schema);
  }

  return {
    request,
    get: (path, options) => request("GET", path, options),
    post: (path, options) => request("POST", path, options),
    put: (path, options) => request("PUT", path, options),
    patch: (path, options) => request("PATCH", path, options),
    delete: (path, options) => request("DELETE", path, options),
  };
}
