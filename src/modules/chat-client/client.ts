// Typed calls for the parent/expert chat endpoints. Takes an injected `fetch` and token getter so the same code
// runs in the browser, in Node tests, and in React Native (`expo/fetch`). It never logs and never stores a token.

import type { z } from "zod";
import { ChatApiError, ChatErrorCode, isAbortError, networkError, parseProblem } from "./problem";
import {
  childListSchema,
  conversationListSchema,
  conversationSchema,
  loginSchema,
  meSchema,
  messagePageSchema,
  messageSchema,
  summarySchema,
  topicListSchema,
  type Conversation,
  type LoginResult,
  type Me,
  type Message,
  type MessagePage,
} from "./types";

export interface ChatClientOptions {
  /** Backend origin with no `/v1` and no trailing slash, e.g. `https://api.example.com`. */
  baseUrl: string;
  /** Read at call time, so a token that is replaced (a new impersonation) is picked up without a new client. */
  getToken: () => string | null;
  fetch?: typeof fetch;
}

/** What the streaming helpers need: where to call, how to authenticate, which fetch to use. */
export interface ChatTransport {
  url(path: string, query?: Record<string, string | number | undefined>): string;
  headers(extra?: Record<string, string>): Headers;
  fetch: typeof fetch;
}

export function createTransport(options: ChatClientOptions): ChatTransport {
  const base = options.baseUrl.replace(/\/+$/, "");
  return {
    url(path, query) {
      const url = `${base}/v1/${path.replace(/^\/+/, "")}`;
      if (!query) return url;
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, String(value));
      const qs = params.toString();
      return qs ? `${url}?${qs}` : url;
    },
    headers(extra) {
      const headers = new Headers(extra);
      const token = options.getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
    // Resolved per call, not captured, so a test or a polyfill installed later is honoured.
    fetch: options.fetch ?? ((input, init) => fetch(input, init)),
  };
}

/** A fresh id for one user message. Reuse it only to retry that same message. */
export function newClientMessageId(): string {
  return globalThis.crypto.randomUUID();
}

export interface RequestOptions {
  signal?: AbortSignal;
}

interface JsonRequest<S extends z.ZodType> extends RequestOptions {
  method: "GET" | "POST";
  path: string;
  schema: S;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

export function createChatClient(options: ChatClientOptions) {
  const transport = createTransport(options);

  /** Fetches and maps every failure to a ChatApiError; aborts are re-thrown untouched. */
  async function send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await transport.fetch(url, init);
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw networkError();
    }
  }

  async function request<S extends z.ZodType>(req: JsonRequest<S>): Promise<z.infer<S>> {
    const headers = transport.headers({ Accept: "application/json" });
    const init: RequestInit = { method: req.method, headers, signal: req.signal };
    if (req.body !== undefined) {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(req.body);
    }
    const response = await send(transport.url(req.path, req.query), init);
    if (!response.ok) throw await parseProblem(response);
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw badResponse(response);
    }
    const parsed = req.schema.safeParse(json);
    if (!parsed.success) throw badResponse(response);
    return parsed.data;
  }

  const id = encodeURIComponent;

  return {
    transport,

    /** No token needed. The response carries tokens only; call `me()` to learn who signed in. */
    login(email: string, password: string, opts?: RequestOptions): Promise<LoginResult> {
      return request({ method: "POST", path: "auth/login", schema: loginSchema, body: { email, password }, ...opts });
    },
    me(opts?: RequestOptions): Promise<Me> {
      return request({ method: "GET", path: "users/me", schema: meSchema, ...opts });
    },

    topics(opts?: RequestOptions) {
      return request({ method: "GET", path: "ai-chat/topics", schema: topicListSchema, ...opts });
    },
    children(opts?: RequestOptions) {
      return request({ method: "GET", path: "children", schema: childListSchema, ...opts });
    },

    createAiConversation(childId: string, topic: string, opts?: RequestOptions): Promise<Conversation> {
      return request({
        method: "POST",
        path: `children/${id(childId)}/ai-conversations`,
        schema: conversationSchema,
        body: { topic },
        ...opts,
      });
    },
    /** Parent starts a chat with the child's assigned expert. `409 NO_EXPERT_ASSIGNED` when there is none. */
    createConversation(childId: string, opts?: RequestOptions): Promise<Conversation> {
      return request({ method: "POST", path: `children/${id(childId)}/conversations`, schema: conversationSchema, ...opts });
    },
    listConversations(childId: string, opts?: RequestOptions) {
      return request({ method: "GET", path: `children/${id(childId)}/conversations`, schema: conversationListSchema, ...opts });
    },
    closeConversation(conversationId: string, opts?: RequestOptions): Promise<Conversation> {
      return request({ method: "POST", path: `conversations/${id(conversationId)}/close`, schema: conversationSchema, ...opts });
    },

    listMessages(
      conversationId: string,
      query: { afterSeq?: number; limit?: number } = {},
      opts?: RequestOptions,
    ): Promise<MessagePage> {
      return request({
        method: "GET",
        path: `conversations/${id(conversationId)}/messages`,
        schema: messagePageSchema,
        query,
        ...opts,
      });
    },
    /** Human chats only (`422 NOT_A_HUMAN_CONVERSATION` for an AI chat). Repeating a `clientMessageId` returns the stored message. */
    sendMessage(
      conversationId: string,
      body: { text: string; clientMessageId: string },
      opts?: RequestOptions,
    ): Promise<Message> {
      return request({
        method: "POST",
        path: `conversations/${id(conversationId)}/messages`,
        schema: messageSchema,
        body,
        ...opts,
      });
    },

    summary(conversationId: string, opts?: RequestOptions) {
      return request({ method: "GET", path: `conversations/${id(conversationId)}/summary`, schema: summarySchema, ...opts });
    },
  };
}

export type ChatClient = ReturnType<typeof createChatClient>;

function badResponse(response: Response): ChatApiError {
  return new ChatApiError({
    status: response.status,
    code: ChatErrorCode.BadResponse,
    title: "Unexpected response",
    detail: "The server returned something unexpected.",
    requestId: response.headers.get("x-request-id"),
  });
}
