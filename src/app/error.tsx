"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
      <p className="script-line script-line--sm">Something ruffled a few feathers.</p>
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-gray-600">
        An unexpected error occurred. Try again in a moment.
      </p>
      <button className="btn btn--primary btn--pill" type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}