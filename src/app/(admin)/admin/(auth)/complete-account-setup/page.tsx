import type { Metadata } from "next";
import { AuthLayout } from "@/modules/admin/auth/auth-layout";
import { LinkProblem } from "@/modules/admin/auth/link-problem";
import { completeAccountSetupAction } from "@/modules/admin/auth/recovery-actions";
import { SetPasswordForm } from "@/modules/admin/auth/set-password-form";

// The one-time token is in the URL: never leak it through the Referer header.
export const metadata: Metadata = { title: "Set up your account · NeuroNest Admin", referrer: "no-referrer" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return (
    <AuthLayout title="Set up your account" description="Choose a password to finish setting up your NeuroNest account.">
      {value ? (
        <SetPasswordForm action={completeAccountSetupAction} token={value} submitLabel="Set password" pendingLabel="Saving…" />
      ) : (
        <LinkProblem message="This setup link is incomplete. Ask an administrator to resend your invitation." actionHref="/login" actionLabel="Go to sign in" />
      )}
    </AuthLayout>
  );
}
