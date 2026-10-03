#!/usr/bin/env node
// PreToolUse(Bash) guard. Commits and PRs must go out under the configured git
// identity only: no AI co-author trailers, no "Generated with" footers, no
// author/committer overrides. Companion to `attribution` in .claude/settings.json.
import { readFileSync } from "node:fs";

let command = "";
try {
  command = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}

const writesHistory = /\bgit\b[^\n]*\bcommit\b|\bgh\s+pr\s+(create|edit)\b/.test(command);
if (!writesHistory) process.exit(0);

const violations = [
  [/co-authored-by:[^\n]*(claude|anthropic|\bai\b)/i, "AI Co-Authored-By trailer"],
  [/noreply@anthropic\.com/i, "Anthropic noreply address"],
  [/generated with[^\n]*(claude|\bai\b)/i, '"Generated with ..." footer'],
  [/claude-session\s*:/i, "Claude-Session trailer"],
  [/\u{1F916}/u, "robot emoji attribution"],
  [/--author(=|\s)/, "--author override"],
  [/\bgit\s+(-\S+\s+)*-c\s+user\.(name|email)\s*=/, "user.name / user.email override"],
  [/\bGIT_(AUTHOR|COMMITTER)_(NAME|EMAIL)\s*=/, "GIT_AUTHOR_* / GIT_COMMITTER_* override"],
]
  .filter(([pattern]) => pattern.test(command))
  .map(([, label]) => label);

if (violations.length === 0) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `Blocked: ${violations.join(", ")}. Commits and PRs must use the configured git ` +
        "identity (git config user.name / user.email) with no AI attribution. " +
        "Remove those lines/flags and retry.",
    },
  }),
);
