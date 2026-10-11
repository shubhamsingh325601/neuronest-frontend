export const CHILD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "plans", label: "Plans" },
  { value: "media", label: "Media" },
  { value: "calls", label: "Call history" },
] as const;
export type ChildTab = (typeof CHILD_TABS)[number]["value"];

/** The tab named in `?tab=`, or Overview for a missing or unknown value. */
export function parseChildTab(value: string | null): ChildTab {
  return CHILD_TABS.find((tab) => tab.value === value)?.value ?? "overview";
}
