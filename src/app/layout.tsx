import { Lora, Caveat, Inter } from "next/font/google";
import { createMetadata } from "@/lib/seo";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { SplashScreen } from "@/components/layout/splash-screen";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = createMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${lora.variable} ${caveat.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Synchronous pre-paint check: eliminates any flash of nav or layout before the splash screen */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var hasSeen = sessionStorage.getItem('neuronest_splash_seen');
                  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  if (!hasSeen && !prefersReduced) {
                    document.documentElement.classList.add('splash-pending');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <OrganizationJsonLd />
      </head>
      <body>
        <SplashScreen />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}