import { notFound } from "next/navigation";

// Catch-all so every unmatched URL renders (public)/not-found.tsx inside the public root layout.
export default function CatchAllPage() {
  notFound();
}
