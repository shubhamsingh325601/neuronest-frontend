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

export const clinicianKeys = {
  all: ["clinicians"] as const,
  list: (filters: { status?: string; q?: string }) => [...clinicianKeys.all, "list", filters] as const,
  detail: (id: string) => [...clinicianKeys.all, "detail", id] as const,
};

export const userKeys = {
  all: ["users"] as const,
  list: (filters: { role?: string; status?: string }) => [...userKeys.all, "list", filters] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export const childKeys = {
  all: ["children"] as const,
  list: () => [...childKeys.all, "list"] as const,
  detail: (id: string) => [...childKeys.all, "detail", id] as const,
  careTeam: (id: string) => [...childKeys.all, "care-team", id] as const,
};
