// Query keys for data fetched with a parent token. They carry the parent's id (not a secret) so one parent's
// children and topics are never shown for another, and never a token. The whole root is dropped on Exit.

export const CONSOLE_QUERY_ROOT = "parent-console";

export const consoleKeys = {
  all: [CONSOLE_QUERY_ROOT] as const,
  children: (parentId: string) => [CONSOLE_QUERY_ROOT, parentId, "children"] as const,
  topics: (parentId: string) => [CONSOLE_QUERY_ROOT, parentId, "topics"] as const,
};
