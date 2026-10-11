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
