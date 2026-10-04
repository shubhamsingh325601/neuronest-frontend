import { AuthLayout } from "./auth-layout";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  error?: string;
  notice?: string;
  /** Validated post-login destination (see safeNextPath). */
  next?: string;
}

export function LoginPage({ error, notice, next }: LoginPageProps) {
  return (
    <AuthLayout title="Welcome back" description="Sign in to the NeuroNest admin console.">
      <LoginForm error={error} notice={notice} next={next} />
    </AuthLayout>
  );
}
