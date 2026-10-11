import { PageHeader } from "../../app-shell/page-header";
import { CreateForm } from "./components/create-form";

export function NewExpertPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Add expert" description="Create an expert account with an email and password. There is no invitation step." />
      <CreateForm />
    </div>
  );
}
