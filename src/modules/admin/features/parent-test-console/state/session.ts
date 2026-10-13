"use client";

import { create } from "zustand";
import type { ImpersonationResult } from "@/modules/chat-client/types";

// parent-console: the Parent test console's only state. It holds a parent (impersonation) token and an expert
// token IN MEMORY: no `persist`, never localStorage, cookies, the URL, logs or query keys. A reload drops both,
// which is the intended way out. The admin's own token never comes here (it stays in httpOnly cookies).

export interface ConsoleUser {
  id: string;
  name: string;
  email: string;
}

/** Why the parent session ended by itself; null for a deliberate Exit. Shown until the next "Act as". */
export type ExitReason = "expired" | "refused";

interface SessionState {
  parentToken: string | null;
  endedBecause: ExitReason | null;
  /** Epoch ms when the parent token stops working. There is no refresh token. */
  expiresAt: number | null;
  parent: ConsoleUser | null;
  expertToken: string | null;
  expert: ConsoleUser | null;
  startParent: (result: ImpersonationResult, now?: number) => void;
  /** `expired`: the countdown reached 0. `refused`: the backend answered 401 INVALID_TOKEN. Omit for a manual Exit. */
  exitParent: (reason?: ExitReason) => void;
  startExpert: (token: string, user: ConsoleUser) => void;
  exitExpert: () => void;
}

const NO_PARENT = { parentToken: null, expiresAt: null, parent: null } as const;
const NO_EXPERT = { expertToken: null, expert: null } as const;

export const useConsoleSession = create<SessionState>()((set) => ({
  ...NO_PARENT,
  ...NO_EXPERT,
  endedBecause: null,
  startParent: (result, now = Date.now()) =>
    set({
      endedBecause: null,
      parentToken: result.accessToken,
      expiresAt: now + result.expiresIn * 1000,
      parent: { id: result.user.id, name: result.user.name, email: result.user.email },
      // Acting as a different parent invalidates a test that was set up for the previous one.
      ...NO_EXPERT,
    }),
  // The expert test only makes sense next to a parent, so leaving the parent leaves both. Components that hold
  // streams unmount when the token goes, and their cleanup aborts every fetch.
  exitParent: (reason) => set({ ...NO_PARENT, ...NO_EXPERT, endedBecause: reason ?? null }),
  startExpert: (token, user) => set({ expertToken: token, expert: user }),
  exitExpert: () => set({ ...NO_EXPERT }),
}));

/** Read at call time by the chat clients, so a replaced token is picked up without rebuilding them. */
export const getParentToken = () => useConsoleSession.getState().parentToken;
export const getExpertToken = () => useConsoleSession.getState().expertToken;
