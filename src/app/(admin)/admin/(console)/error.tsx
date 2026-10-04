"use client";

import { ErrorState } from "@/modules/admin/app-shell/states";

export default function ConsoleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
