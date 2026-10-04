import { notFound } from "next/navigation";

// Unmatched admin URLs render the console 404 inside the shell.
export default function CatchAll() {
  notFound();
}
