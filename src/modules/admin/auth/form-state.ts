/** State returned by the auth Server Actions (mirrors the landing `FormState` idea, kept separate by the import boundary). */
export interface AuthFormState {
  status: "idle" | "error" | "success";
  /** Form-level message (wrong credentials, rate limit, no admin access, ...). */
  error?: string;
  /** Neutral confirmation shown on success. */
  message?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword" | "token", string>>;
  /** Epoch ms until which submitting is pointless (backend 429). The submit button counts down to it. */
  retryUntil?: number;
  /** Echoed back so React 19's post-action form reset does not wipe what the user typed. */
  email?: string;
}

export const idleState: AuthFormState = { status: "idle" };
