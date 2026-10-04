import type { Metadata } from "next";
import { AuthLayout } from "@/modules/admin/auth/auth-layout";
import { LinkProblem } from "@/modules/admin/auth/link-problem";
import { resetPasswordAction } from "@/modules/admin/auth/recovery-actions";
import { SetPasswordForm } from "@/modules/admin/auth/set-password-form";

// The one-time token is in the URL: never leak it through the Referer header.
export const metadata: Metadata = { title: "Choose a new password · NeuroNest Admin", referrer: "no-referrer" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const value = Array.isArray(token) ? token[0] : token;
  return (
    <AuthLayout title="Choose a new password" description="Pick a strong password. Changing it signs you out everywhere.">
      {value ? (
        <SetPasswordForm action={resetPasswordAction} token={value} submitLabel="Change password" pendingLabel="Changing…" />
      ) : (
        <LinkProblem message="This reset link is incomplete. Request a new one." actionHref="/forgot-password" actionLabel="Request a new link" />
      )}
    </AuthLayout>
  );
}
