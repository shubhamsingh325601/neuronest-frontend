import Link from "next/link";
import { siteContent } from "@/lib/content";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
      <p className="script-line script-line--sm">You&apos;ve wandered off the nest.</p>
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="max-w-md text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link className="btn btn--primary btn--pill" href="/">
        Back to {siteContent.brand.name}
      </Link>
    </main>
  );
}