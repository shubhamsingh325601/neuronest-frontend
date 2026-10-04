import type { Metadata } from "next";
import { AuthLayout } from "@/modules/admin/auth/auth-layout";
import { safeNextPath } from "@/modules/admin/auth/safe-next";
import { SessionErrorView } from "@/modules/admin/auth/session-error-view";

export const metadata: Metadata = { title: "Session paused · NeuroNest Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const retry = Number(first(params.retry));
  return (
    <AuthLayout
      title="Session paused"
      description="We could not refresh your session just now."
      footer="Nothing has been lost. Trying again continues where you left off."
    >
      <SessionErrorView
        reason={first(params.reason) === "rate-limited" ? "rate-limited" : "unavailable"}
        retryAfter={Number.isFinite(retry) && retry > 0 ? Math.min(Math.floor(retry), 3600) : undefined}
        next={safeNextPath(first(params.next))}
      />
    </AuthLayout>
  );
}
