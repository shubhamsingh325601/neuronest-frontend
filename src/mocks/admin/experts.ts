import { ErrorCode } from "@/modules/admin/lib/api-errors";
import type { Expert, ExpertApi, ExpertDetail } from "@/modules/admin/features/experts/api/types";
import { MOCK_LATENCY_MS, delay, mockError, paginate } from "./_factory";

// TEMPORARY sample experts (plan 0001 §18). Shown only when the data-source flags select mock data for Experts.
// Created experts live in memory until the page reloads. Children come from the live children API, so child
// names in mock mode only resolve when a backend is reachable.
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const seed = (): Expert[] => [
  { id: "e-1", name: "Dr. Maya Iyer", email: "maya.iyer@experts.example", status: "ACTIVE", createdAt: ago(60) },
  { id: "e-2", name: "Jonas Becker", email: "jonas.becker@experts.example", status: "SUSPENDED", createdAt: ago(20) },
];

let experts = seed();
const childSets = new Map<string, string[]>();

const notFound = () => mockError(404, "EXPERT_NOT_FOUND", "Expert not found.");

function detailOf(row: Expert): ExpertDetail {
  return { ...row, lastLoginAt: row.status === "ACTIVE" ? ago(1) : null, assignedChildIds: childSets.get(row.id) ?? [] };
}

function find(id: string): Expert {
  const row = experts.find((expert) => expert.id === id);
  if (!row) throw notFound();
  return row;
}

function assertEmailFree(email: string, exceptId?: string) {
  if (experts.some((expert) => expert.id !== exceptId && expert.email.toLowerCase() === email)) {
    throw mockError(409, ErrorCode.EmailAlreadyRegistered, "This email is already registered.");
  }
}

export const mockExpertApi: ExpertApi = {
  async list({ cursor, limit, status, q }, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    const needle = q?.trim().toLowerCase();
    const rows = experts.filter(
      (expert) =>
        (!status || expert.status === status) &&
        (!needle || expert.name.toLowerCase().includes(needle) || expert.email.toLowerCase().includes(needle)),
    );
    return paginate(rows, { cursor, limit });
  },

  async create(input) {
    await delay(MOCK_LATENCY_MS);
    const email = input.email.trim().toLowerCase();
    assertEmailFree(email);
    const row: Expert = { id: `e-${experts.length + 1}`, name: input.name, email, status: "ACTIVE", createdAt: new Date().toISOString() };
    experts = [row, ...experts];
    return detailOf(row);
  },

  async get(id, signal) {
    await delay(MOCK_LATENCY_MS, signal);
    return detailOf(find(id));
  },

  async update(id, input) {
    await delay(MOCK_LATENCY_MS);
    const row = find(id);
    if (input.email !== undefined) {
      const email = input.email.trim().toLowerCase();
      assertEmailFree(email, id);
      row.email = email;
    }
    if (input.name !== undefined) row.name = input.name;
    return detailOf(row);
  },

  async setChildren(id, childIds) {
    await delay(MOCK_LATENCY_MS);
    find(id);
    const unique = [...new Set(childIds)];
    childSets.set(id, unique);
    return { childIds: unique };
  },

  async setStatus(id, action) {
    await delay(MOCK_LATENCY_MS);
    const row = find(id);
    row.status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
    return { id, status: row.status, updatedAt: new Date().toISOString() };
  },
};

/** Test hook: restore the sample rows. */
export function resetMockExperts(): void {
  experts = seed();
  childSets.clear();
}
