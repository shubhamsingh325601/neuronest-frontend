import { Suspense } from "react";
import { LoadingState } from "@/modules/admin/app-shell/states";
import { PlanTemplatesPage } from "@/modules/admin/features/plan-templates/plan-templates-page";

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading plan templates" />}>
      <PlanTemplatesPage />
    </Suspense>
  );
}
