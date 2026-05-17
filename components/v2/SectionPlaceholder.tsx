import Link from "next/link";

/**
 * Shared placeholder for v2.0 routes that are scaffolded but not yet built.
 * Keeps new routes viewable without pretending to be finished.
 */
export function SectionPlaceholder({
  section,
  title,
  blurb,
}: {
  section: string;
  title: string;
  blurb: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-copper">
        {section}
      </span>
      <h1 className="mt-5 font-display text-3xl tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{blurb}</p>
      <Link
        href="/"
        className="mt-8 text-sm text-muted-2 transition-colors hover:text-foreground"
      >
        &larr; Back to Atelier
      </Link>
    </main>
  );
}
