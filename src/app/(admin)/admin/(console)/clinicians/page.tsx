import { Suspense } from "react";
import { LoadingState } from "@/modules/admin/app-shell/states";
import { CliniciansPage } from "@/modules/admin/features/clinicians/clinicians-page";

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading clinicians" />}>
      <CliniciansPage />
    </Suspense>
  );
}
