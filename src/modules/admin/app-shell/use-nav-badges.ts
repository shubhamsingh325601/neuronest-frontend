"use client";

import { useAdminSummaryQuery } from "../features/dashboard/hooks/use-admin-summary";
import type { NavBadges } from "./sidebar-nav";

/**
 * Sidebar counts from GET /admin/summary, the same cached query the dashboard uses (one cheap call, no paging).
 * Only `childrenWithoutClinician` is shown: a child with no clinician is something an admin can fix at once, while
 * invited clinicians are an expected waiting state and the summary has no count of suspended users. While the
 * summary loads, or if it fails, there is simply no badge.
 */
export function useNavBadges(): NavBadges {
  const summary = useAdminSummaryQuery();
  return summary.data ? { childrenWithoutClinician: summary.data.childrenWithoutClinician } : {};
}
