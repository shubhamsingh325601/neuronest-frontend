import { PageHeader } from "../../app-shell/page-header";
import { InviteForm } from "./components/invite-form";

export function InvitePage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Invite clinician"
        description="Create a clinician account. They are emailed a link to set their password; until then their status is Invited."
      />
      <InviteForm />
    </div>
  );
}
