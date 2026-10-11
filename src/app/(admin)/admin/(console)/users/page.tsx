import { Suspense } from "react";
import { LoadingState } from "@/modules/admin/app-shell/states";
import { UsersPage } from "@/modules/admin/features/users/users-page";

// useSearchParams needs a Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading users" />}>
      <UsersPage />
    </Suspense>
  );
}
