// Wire shapes for the chat endpoints (backend: neuro-nest-backend/docs/frontend-handoff-chat-and-test-console.md).
// Framework-free on purpose: this module is shared with the React Native apps. Objects are "loose" so a field the
// backend adds later does not break parsing.

import { z } from "zod";

export const MESSAGE_SENDERS = ["PARENT", "EXPERT", "AI"] as const;
export const MESSAGE_STATES = ["COMPLETE", "RETRACTED", "REDIRECTED"] as const;

export const messageSchema = z.looseObject({
  id: z.string(),
  seq: z.number().int(),
  sender: z.enum(MESSAGE_SENDERS),
  state: z.enum(MESSAGE_STATES),
  body: z.string(),
  clientMessageId: z.string().nullable(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

export const messagePageSchema = z.looseObject({
  purged: z.boolean(),
  items: z.array(messageSchema),
});
export type MessagePage = z.infer<typeof messagePageSchema>;

export const conversationSchema = z.looseObject({
  id: z.string(),
  kind: z.enum(["AI", "HUMAN"]),
  topic: z.string().nullable(),
  childId: z.string(),
  status: z.enum(["OPEN", "CLOSED"]),
  lastMessageAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  messagesPurgedAt: z.string().nullable(),
  createdAt: z.string(),
  summaryStatus: z.string().nullable().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const topicSchema = z.looseObject({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  kind: z.enum(["AI", "ROUTE", "UNAVAILABLE"]),
});
export type Topic = z.infer<typeof topicSchema>;

export const topicListSchema = z.looseObject({
  version: z.number(),
  data: z.array(topicSchema),
});

export const childSchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  preferredName: z.string().nullable().optional(),
});
export type Child = z.infer<typeof childSchema>;

export const childListSchema = z.looseObject({
  data: z.array(childSchema),
  nextCursor: z.string().nullable().optional(),
});

export const conversationListSchema = z.looseObject({
  data: z.array(conversationSchema),
  nextCursor: z.string().nullable(),
});

export const roleSchema = z.enum(["PARENT", "CLINICIAN", "ADMIN", "EXPERT"]);

export const userSummarySchema = z.looseObject({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
});
export type UserSummary = z.infer<typeof userSummarySchema>;

/** `POST users/:id/impersonate` (admin token). No refresh token exists: the admin mints another when it expires. */
export const impersonationSchema = z.looseObject({
  accessToken: z.string(),
  expiresIn: z.number(),
  user: userSummarySchema,
  impersonatedBy: z.string(),
});
export type ImpersonationResult = z.infer<typeof impersonationSchema>;

/** `POST auth/login` returns tokens only, with no `user` object, so callers read `users/me` afterwards. */
export const loginSchema = z.looseObject({
  accessToken: z.string(),
  expiresIn: z.number(),
  refreshToken: z.string().optional(),
});
export type LoginResult = z.infer<typeof loginSchema>;

export const meSchema = z.looseObject({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: roleSchema,
});
export type Me = z.infer<typeof meSchema>;

export const summarySchema = z.looseObject({
  id: z.string(),
  conversationId: z.string(),
  childId: z.string(),
  kind: z.enum(["AI", "HUMAN"]),
  status: z.enum(["PENDING", "READY", "FAILED", "PLACEHOLDER"]),
  content: z.looseObject({ overview: z.string() }).nullable(),
  note: z.string().nullable(),
  generatedAt: z.string().nullable(),
  conversationClosedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ConversationSummary = z.infer<typeof summarySchema>;

// --- AI send stream events (custom protocol, not the AI SDK UI-message protocol) ---

export const deltaDataSchema = z.object({ text: z.string() });
export const doneDataSchema = z.looseObject({
  messageId: z.string(),
  seq: z.number().int(),
  state: z.enum(MESSAGE_STATES),
  conversationClosed: z.boolean(),
});
export const errorDataSchema = z.looseObject({ code: z.string() });
export const statusDataSchema = z.looseObject({ phase: z.string() });

export type AiStreamEvent =
  | { type: "status"; phase: string }
  | { type: "delta"; text: string }
  | { type: "retract"; text: string }
  // Not sent by the backend yet (it appends the footer as a final `delta`); parsed so the UI needs no change when it is.
  | { type: "footer"; text: string }
  | { type: "done"; messageId: string; seq: number; state: Message["state"]; conversationClosed: boolean }
  | { type: "error"; code: string };

// --- Human conversation events stream ---

export const resyncDataSchema = z.looseObject({ lastSeq: z.number().int() });

export type ConversationEvent =
  | { type: "message"; message: Message }
  | { type: "resync"; lastSeq: number }
  | { type: "closed"; conversation: Conversation }
  | { type: "purged"; conversation: Conversation };
