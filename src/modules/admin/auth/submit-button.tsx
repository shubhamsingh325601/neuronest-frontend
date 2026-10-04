"use client";

import { Button } from "../ui/button";
import { useRetryCountdown } from "./use-retry-countdown";

interface SubmitButtonProps {
  label: string;
  pendingLabel: string;
  pending: boolean;
  /** From AuthFormState.retryUntil: disables the button and shows the remaining seconds. */
  retryUntil?: number;
  className?: string;
}

/** Submit button for the auth forms: pending state, and a hard stop while the backend's rate limit applies. */
export function SubmitButton({ label, pendingLabel, pending, retryUntil, className }: SubmitButtonProps) {
  const remaining = useRetryCountdown(retryUntil);
  return (
    <Button type="submit" size="lg" className={className} disabled={pending || remaining > 0}>
      {pending ? pendingLabel : remaining > 0 ? `Try again in ${remaining}s` : label}
    </Button>
  );
}
