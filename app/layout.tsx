import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CommandPalette } from "@/components/CommandPalette";
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
  title: {
    default: "Atelier — Design the backyard before you leave the driveway",
    template: "%s · Atelier",
  },
  description:
    "Atelier turns a conversation into a sited outdoor-living design — scaled layouts, photoreal renders, a line-item estimate, and a client portal that collects the deposit. Built for hardscape and outdoor-living contractors.",
  keywords: [
    "outdoor living design",
    "hardscape design software",
    "patio design tool",
    "landscape estimate software",
    "contractor sales tools",
  ],
  openGraph: {
    title: "Atelier — Outdoor-living design, on a contractor's timeline",
    description:
      "From a backyard walk-through to a photoreal render and a paid deposit before you leave the driveway.",
    url: siteUrl,
    siteName: "Atelier",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier — Outdoor-living design, on a contractor's timeline",
    description:
      "From a backyard walk-through to a photoreal render and a paid deposit before you leave the driveway.",
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
      <body>
        {children}
        <CommandPalette />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border-bright)",
              color: "var(--color-foreground)",
            },
          }}
        />
        <SpeedInsights />
      </body>
    </html>
  );
}
