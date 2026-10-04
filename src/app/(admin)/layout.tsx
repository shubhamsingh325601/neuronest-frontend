import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/modules/admin/providers/providers";
import { themeInitScript } from "@/modules/admin/theme/theme";
import { sidebarInitScript } from "@/modules/admin/state/sidebar-pref";
import "@/modules/admin/styles/admin.css";

// Separate root layout: no landing fonts, globals.css, JSON-LD or splash. Inter only.
// Deliberately not createMetadata(), which points the canonical URL at the public site.
// Subset and variable name differ from the landing's Inter on purpose, so the two roots do not
// share a font CSS chunk (which would leak Lora/Caveat declarations into the admin page).
const inter = Inter({
  variable: "--font-admin-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "NeuroNest Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the pre-paint script sets the `dark` class before React hydrates.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: sidebarInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
