import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";
import type { ImpersonationResult } from "@/modules/chat-client/types";
import { getExpertToken, getParentToken, useConsoleSession } from "./session";

const result: ImpersonationResult = {
  accessToken: "parent-token",
  expiresIn: 3600,
  user: { id: "p1", name: "Test Parent", email: "parent@test.io", role: "PARENT" },
  impersonatedBy: "admin-1",
};

beforeEach(() => {
  useConsoleSession.getState().exitParent();
});

describe("useConsoleSession", () => {
  it("starts empty", () => {
    expect(useConsoleSession.getState()).toMatchObject({ parentToken: null, expiresAt: null, parent: null, expertToken: null, expert: null });
    expect(getParentToken()).toBeNull();
    expect(getExpertToken()).toBeNull();
  });

  it("stores the parent and works out the expiry from expiresIn", () => {
    useConsoleSession.getState().startParent(result, 1_000_000);
    expect(useConsoleSession.getState()).toMatchObject({
      parentToken: "parent-token",
      expiresAt: 1_000_000 + 3_600_000,
      parent: { id: "p1", name: "Test Parent", email: "parent@test.io" },
    });
    expect(getParentToken()).toBe("parent-token");
  });

  it("keeps only id, name and email of the parent", () => {
    useConsoleSession.getState().startParent(result);
    expect(Object.keys(useConsoleSession.getState().parent ?? {}).sort()).toEqual(["email", "id", "name"]);
  });

  it("drops the expert when acting as another parent", () => {
    const s = useConsoleSession.getState();
    s.startParent(result);
    s.startExpert("expert-token", { id: "e1", name: "Expert", email: "e@test.io" });
    expect(getExpertToken()).toBe("expert-token");
    s.startParent({ ...result, accessToken: "second" });
    expect(getParentToken()).toBe("second");
    expect(getExpertToken()).toBeNull();
  });

  it("exit drops both tokens", () => {
    const s = useConsoleSession.getState();
    s.startParent(result);
    s.startExpert("expert-token", { id: "e1", name: "Expert", email: "e@test.io" });
    s.exitParent();
    expect(useConsoleSession.getState()).toMatchObject({ parentToken: null, expiresAt: null, parent: null, expertToken: null, expert: null });
  });

  it("remembers why a session ended by itself, and forgets it on the next Act as", () => {
    const s = useConsoleSession.getState();
    s.startParent(result);
    s.exitParent("expired");
    expect(useConsoleSession.getState()).toMatchObject({ parentToken: null, endedBecause: "expired" });
    s.startParent(result);
    expect(useConsoleSession.getState().endedBecause).toBeNull();
    s.exitParent("refused");
    expect(useConsoleSession.getState().endedBecause).toBe("refused");
    s.exitParent();
    expect(useConsoleSession.getState().endedBecause).toBeNull();
  });

  it("exiting only the expert keeps the parent", () => {
    const s = useConsoleSession.getState();
    s.startParent(result);
    s.startExpert("expert-token", { id: "e1", name: "Expert", email: "e@test.io" });
    s.exitExpert();
    expect(getParentToken()).toBe("parent-token");
    expect(getExpertToken()).toBeNull();
  });

  it("never persists: no storage, cookies or zustand persist in the store's code", () => {
    const code = readFileSync(fileURLToPath(new URL("./session.ts", import.meta.url)), "utf8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("//"))
      .join("\n");
    expect(code).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie|persist/);
  });
});
