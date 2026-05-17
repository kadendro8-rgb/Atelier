import type { Metadata } from "next";

/**
 * The marketing studio is an internal operations tool for factory worker E2,
 * deliberately separate from the public product channel — it is excluded from
 * search indexing and the main site navigation.
 */
export const metadata: Metadata = {
  title: "Marketing studio",
  description:
    "Internal marketing studio — generate and preview brand-accurate social " +
    "posts, articles, ads, and schema for Atelier.",
  robots: { index: false, follow: false },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
