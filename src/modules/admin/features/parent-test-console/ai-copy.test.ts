import { describe, expect, it } from "vitest";
import {
  describeAiFailure,
  describeAiNotice,
  LABEL_STILL_WORKING,
  LABEL_TAKING_LONGER,
  LABEL_THINKING,
  offersInlineStop,
  thinkingLabel,
} from "./ai-copy";

describe("thinkingLabel", () => {
  it("is derived from the elapsed time when the backend sends no status", () => {
    expect(thinkingLabel(null, 0)).toBe(LABEL_THINKING);
    expect(thinkingLabel(null, 5_999)).toBe(LABEL_THINKING);
    expect(thinkingLabel(null, 6_000)).toBe(LABEL_STILL_WORKING);
    expect(thinkingLabel(null, 14_999)).toBe(LABEL_STILL_WORKING);
    expect(thinkingLabel(null, 15_000)).toBe(LABEL_TAKING_LONGER);
  });

  it("names the neutral phase once the backend reports one, whatever the time", () => {
    expect(thinkingLabel("thinking", 30_000)).toBe("Thinking…");
    expect(thinkingLabel("checking", 0)).toBe("Checking the answer…");
    expect(thinkingLabel("writing", 0)).toBe("Writing…");
    expect(thinkingLabel("reading", 0)).toBe("Reading your question…");
  });

  it("falls back to a generic label for a phase it does not know", () => {
    expect(thinkingLabel("pondering", 0)).toBe("Thinking…");
  });

  it("offers Stop inline only when the wait is long", () => {
    expect(offersInlineStop(14_999)).toBe(false);
    expect(offersInlineStop(15_000)).toBe(true);
  });
});

describe("describeAiFailure", () => {
  it.each([
    "AI_RATE_LIMITED",
    "AI_BUDGET",
    "AI_TIMEOUT",
    "AI_PROVIDER",
    "AI_FAILED",
    "AI_INVALID_OUTPUT",
    "AI_BLOCKED",
    "CONVERSATION_CLOSED",
    "STOPPED",
    "NETWORK_ERROR",
    "STREAM_ENDED",
  ])("has copy for %s", (code) => {
    const { text } = describeAiFailure(code);
    expect(text.length).toBeGreaterThan(10);
    expect(text).not.toContain(code);
  });

  it("does not offer a retry that cannot work", () => {
    expect(describeAiFailure("AI_BLOCKED").canRetry).toBe(false);
    expect(describeAiFailure("CONVERSATION_CLOSED").canRetry).toBe(false);
    expect(describeAiFailure("AI_TIMEOUT").canRetry).toBe(true);
    expect(describeAiFailure("STOPPED").canRetry).toBe(true);
  });

  it("treats an unknown or missing code as a generic failure", () => {
    expect(describeAiFailure("SOMETHING_NEW")).toEqual(describeAiFailure("AI_FAILED"));
    expect(describeAiFailure(null)).toEqual(describeAiFailure("AI_FAILED"));
  });
});

describe("describeAiNotice", () => {
  it.each([
    "AI_CHAT_BUSY",
    "AI_CHAT_LIMIT_REACHED",
    "MESSAGE_TOO_LONG",
    "AI_DISABLED",
    "AI_UNAVAILABLE",
    "CLIENT_MESSAGE_ID_IN_USE",
    "AI_CHAT_REPLY_UNAVAILABLE",
    "NOT_AN_AI_CONVERSATION",
    "VALIDATION_ERROR",
    "CONVERSATION_CLOSED",
    "AI_CHAT_OFF_TOPIC_LIMIT",
  ])("has copy for %s", (code) => {
    const { text } = describeAiNotice(code);
    expect(text).not.toContain(code);
    expect(text.length).toBeGreaterThan(10);
  });

  it("is quiet for a busy chat and loud for a switched-off feature", () => {
    expect(describeAiNotice("AI_CHAT_BUSY").tone).toBe("quiet");
    expect(describeAiNotice("AI_DISABLED").tone).toBe("error");
  });

  it("adds the wait from Retry-After", () => {
    expect(describeAiNotice("AI_CHAT_BUSY", 3).text).toContain("Try again in 3 seconds");
    expect(describeAiNotice("AI_CHAT_BUSY", 1).text).toContain("Try again in 1 second.");
  });

  it("names the code for an unknown refusal so it can be reported", () => {
    expect(describeAiNotice("BRAND_NEW_CODE").text).toContain("BRAND_NEW_CODE");
  });
});
