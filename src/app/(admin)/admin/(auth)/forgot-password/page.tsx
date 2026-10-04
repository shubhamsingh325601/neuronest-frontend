import type { Metadata } from "next";
import { AuthLayout } from "@/modules/admin/auth/auth-layout";
import { ForgotPasswordForm } from "@/modules/admin/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password · NeuroNest Admin" };

export default function Page() {
  return (
    <AuthLayout title="Reset your password" description="Enter your email and we will send you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
