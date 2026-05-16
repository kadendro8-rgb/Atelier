import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { authEnabled } from "@/lib/auth";
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
  const tree = (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );

  if (!authEnabled) return tree;

  return (
    <ClerkProvider
      signInUrl="/auth/signin"
      signUpUrl="/auth/signup"
      signInFallbackRedirectUrl="/builder"
      signUpFallbackRedirectUrl="/builder"
      afterSignOutUrl="/"
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#d28a55",
          colorBackground: "#15130f",
          colorText: "#f5f1e8",
          colorTextSecondary: "#a89e8c",
          colorInputBackground: "#0b0a09",
          colorInputText: "#f5f1e8",
          borderRadius: "0.65rem",
          fontFamily: "var(--font-inter)",
        },
      }}
    >
      {tree}
    </ClerkProvider>
  );
}
