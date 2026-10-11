import { ClipboardList, GraduationCap, Stethoscope, UserPlus } from "lucide-react";
import { ADMIN_ROUTES } from "../../navigation/paths";
import { filterAndSort } from "../match";
import type { SearchProvider, SearchResult } from "../types";

export const ACTIONS: SearchResult[] = [
  { id: "invite-clinician", title: "Invite a clinician", subtitle: "Send an invitation by email", icon: Stethoscope, href: ADMIN_ROUTES.inviteClinician, keywords: ["new", "add", "create", "clinician", "doctor"] },
  { id: "add-expert", title: "Add an expert", subtitle: "Create an account with a password", icon: GraduationCap, href: ADMIN_ROUTES.newExpert, keywords: ["new", "invite", "create", "expert"] },
  { id: "new-plan-template", title: "New plan template", subtitle: "Write a care plan as a draft", icon: ClipboardList, href: `${ADMIN_ROUTES.planTemplates}/new`, keywords: ["new", "add", "create", "plan", "template", "builder"] },
  { id: "invited-clinicians", title: "Clinicians still invited", subtitle: "Not yet set up their account", icon: UserPlus, href: `${ADMIN_ROUTES.clinicians}?status=INVITED`, keywords: ["pending", "waiting", "invitation", "resend"] },
];

export const actionsProvider: SearchProvider = {
  id: "actions",
  group: "Actions",
  search: (query) => filterAndSort(ACTIONS, query),
};
