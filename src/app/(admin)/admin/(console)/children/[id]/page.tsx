import { Suspense } from "react";
import { LoadingState } from "@/modules/admin/app-shell/states";
import { ChildDetailPage } from "@/modules/admin/features/children/child-detail-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // useSearchParams (the active tab) needs a Suspense boundary.
  return (
    <Suspense fallback={<LoadingState label="Loading child" />}>
      <ChildDetailPage id={id} />
    </Suspense>
  );
}
