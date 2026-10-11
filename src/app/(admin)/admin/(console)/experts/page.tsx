import { Suspense } from "react";
import { LoadingState } from "@/modules/admin/app-shell/states";
import { ExpertsPage } from "@/modules/admin/features/experts/experts-page";

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading experts" />}>
      <ExpertsPage />
    </Suspense>
  );
}
