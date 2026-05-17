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
    default: "Atelier — Design custom homes in an afternoon, not a quarter",
    template: "%s · Atelier",
  },
  description:
    "Atelier turns a conversation into permit-ready custom-home designs — floor plans, site plans, photoreal renders, and a client portal that collects the deposit. Built for builders and residential architects.",
  keywords: [
    "custom home design",
    "AI floor plans",
    "residential architecture software",
    "site plan generator",
    "home builder tools",
  ],
  openGraph: {
    title: "Atelier — Custom-home design, on a builder's timeline",
    description:
      "From a client conversation to permit-ready plans and a paid deposit in a single afternoon.",
    url: siteUrl,
    siteName: "Atelier",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Atelier — Custom-home design, on a builder's timeline",
    description:
      "From a client conversation to permit-ready plans and a paid deposit in a single afternoon.",
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
