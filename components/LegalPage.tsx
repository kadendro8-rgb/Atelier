import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/sections/Footer";

type LegalPageProps = {
  kicker: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
};

/**
 * Shared shell for the legal/contact pages so they read as one consistent
 * family — same Nav, same Footer, same typography rhythm.
 */
export function LegalPage({
  kicker,
  title,
  intro,
  updated,
  children,
}: LegalPageProps) {
  return (
    <>
      <Nav />
      <main id="main" className="border-t border-transparent">
        <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8 sm:pt-36">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          <header className="mt-8 border-b border-border pb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-copper">
              {kicker}
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
              {intro}
            </p>
            <p className="mt-6 text-xs uppercase tracking-[0.14em] text-muted-2">
              Last updated · {updated}
            </p>
          </header>

          <div className="mt-12">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** A titled section within a legal document. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-2xl tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted [&_a]:text-copper-bright [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-copper [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

/** A simple unordered list styled for the legal pages. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-2 size-1.5 shrink-0 rounded-full bg-copper"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
