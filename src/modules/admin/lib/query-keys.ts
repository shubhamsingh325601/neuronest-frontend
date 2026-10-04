// Query-key factories (plan 0001 §15). One per feature, added in the milestone that first needs it.
// Keys are plain arrays so invalidation can target a prefix: `invalidateQueries({ queryKey: adminKeys.all })`.

export const adminKeys = {
  all: ["admin"] as const,
  summary: () => [...adminKeys.all, "summary"] as const,
};

export const systemKeys = {
  all: ["system"] as const,
  health: () => [...systemKeys.all, "health"] as const,
};
