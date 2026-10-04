import type { Metadata } from "next";
import { LOGIN_REASONS, isLoginReason } from "@/modules/admin/auth/login-notices";
import { LoginPage } from "@/modules/admin/auth/login-page";
import { safeNextPath } from "@/modules/admin/auth/safe-next";

export const metadata: Metadata = { title: "Sign in · NeuroNest Admin" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const reason = first(params.reason);
  const entry = reason && isLoginReason(reason) ? LOGIN_REASONS[reason] : undefined;
  const next = first(params.next);
  return (
    <LoginPage
      error={entry?.tone === "error" ? entry.message : undefined}
      notice={entry?.tone === "notice" ? entry.message : undefined}
      next={next ? safeNextPath(next) : undefined}
    />
  );
}
