// Placeholder copy for console routes that are not built yet (plan 0001 §18: permanent content files,
// placeholders marked). Delete an entry when its feature ships.
export interface PlaceholderContent {
  title: string;
  description: string;
  /** Milestone that builds the real page. */
  milestone: string;
  planned: string[];
}

export const PLACEHOLDERS = {
  clinicians: {
    title: "Clinicians",
    description: "Invite clinicians and manage the people who care for children on the platform.",
    milestone: "M6",
    planned: [
      "Clinician directory with a status filter and quick search",
      "Invite a clinician by email; resend the setup link while the invite is pending",
      "Clinician detail with their assigned children",
      "Deactivate and activate accounts, with confirmation",
    ],
  },
  users: {
    title: "Users",
    description: "Parents, clinicians and administrators in one directory.",
    milestone: "M7",
    planned: [
      "Role tabs (Parents, Clinicians, Admins) and a status filter",
      "User detail with linked child or assigned children",
      "Suspend and reactivate accounts (you cannot suspend yourself)",
    ],
  },
  children: {
    title: "Children",
    description: "Every child profile and the team caring for them.",
    milestone: "M8",
    planned: [
      "Children list with age and parent",
      "Care team: assign and revoke clinicians",
      "Plans, media and call history for each child (read only)",
    ],
  },
  planTemplates: {
    title: "Plan templates",
    description: "Reusable care plans that clinicians can assign.",
    milestone: "M9",
    planned: [
      "Template list with status and number of days",
      "Template builder with day-by-day activities",
      "Publish (cannot be undone) and archive",
    ],
  },
  help: {
    title: "Help",
    description: "Guides and support contacts for administrators.",
    milestone: "M10",
    planned: ["Short how-to guides for common admin tasks", "FAQ", "How to reach support"],
  },
  settings: {
    title: "Settings",
    description: "Preferences for this console.",
    milestone: "M10",
    planned: ["Appearance: theme and default sidebar state", "Further settings once the backend supports them"],
  },
  profile: {
    title: "Profile",
    description: "Your account details.",
    milestone: "M10",
    planned: ["Your name, email and last sign-in", "Change password (signs you out of all devices)"],
  },
} satisfies Record<string, PlaceholderContent>;
