"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createQueryClient } from "../lib/query-client";
import { ThemeProvider } from "../theme/theme-provider";
import { Toaster } from "../ui/toaster";
import { TooltipProvider } from "../ui/tooltip";

// Client providers for the whole admin tree. The QueryClient is created once per browser session (useState
// initialiser), never at module level, so server renders cannot share cache between requests.
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
