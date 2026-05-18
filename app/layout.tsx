import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const siteUrl = "https://atelier.design";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Atelier — Hardscape design generator",
  description:
    "Describe a backyard and Atelier generates a scaled hardscape design — a 2D/3D site layout for patios, walkways, driveways and pool decks, with a ballpark installed-cost estimate, live as you edit the brief.",
  keywords: [
    "hardscape design",
    "patio design tool",
    "backyard design generator",
    "hardscape cost estimate",
    "pool deck design",
  ],
  openGraph: {
    title: "Atelier — Hardscape design generator",
    description:
      "Describe a backyard. Get a real hardscape design — instantly.",
    url: siteUrl,
    siteName: "Atelier",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier — Hardscape design generator",
    description:
      "Describe a backyard. Get a real hardscape design — instantly.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
