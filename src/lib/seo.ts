import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://neuronest.co.uk";
export const SITE_NAME = "NeuroNest";
export const DEFAULT_TITLE = "NeuroNest — Nurture, Support, Empower";
export const DEFAULT_DESCRIPTION =
  "A science-backed, human-reviewed plan for your child's unique development — starting with a short video of an everyday moment. Built for parents and vetted clinicians in the UK.";

interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  ogImage = "/assets/footer-img.jpg",
  noIndex = false,
}: SeoOptions = {}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = `${SITE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
    },
    icons: {
      icon: "/assets/icons/logo.png",
      apple: "/assets/icons/logo.png",
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_GB",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
