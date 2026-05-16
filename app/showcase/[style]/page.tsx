import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STYLES } from "@/lib/design";
import { SHOWCASE_CONTENT } from "@/lib/showcase-content";

const siteUrl = "https://atelier.design";

export function generateStaticParams() {
  return STYLES.map((style) => ({ style: style.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ style: string }>;
}): Promise<Metadata> {
  const { style: slug } = await params;
  const style = STYLES.find((s) => s.id === slug);
  const content = style ? SHOWCASE_CONTENT[style.id] : undefined;

  if (!style || !content) {
    return { title: "Showcase style not found" };
  }

  const url = `${siteUrl}/showcase/${style.id}`;

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${content.metaTitle} · Atelier`,
      description: content.metaDescription,
      url,
      siteName: "Atelier",
      type: "article",
      images: [{ url: style.image, alt: `${style.label} home design` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.metaTitle} · Atelier`,
      description: content.metaDescription,
      images: [style.image],
    },
  };
}

export default async function ShowcaseStylePage({
  params,
}: {
  params: Promise<{ style: string }>;
}) {
  const { style: slug } = await params;
  const style = STYLES.find((s) => s.id === slug);
  const content = style ? SHOWCASE_CONTENT[style.id] : undefined;

  if (!style || !content) {
    notFound();
  }

  const related = STYLES.filter((s) => s.id !== style.id).slice(0, 3);

  return (
    <main className="min-h-dvh bg-ink text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <nav className="text-sm text-muted-2">
          <Link href="/" className="transition-colors hover:text-foreground">
            Atelier
          </Link>
          <span className="mx-2 text-border-bright">/</span>
          <Link
            href="/gallery"
            className="transition-colors hover:text-foreground"
          >
            Showcase
          </Link>
          <span className="mx-2 text-border-bright">/</span>
          <span className="text-muted">{style.label}</span>
        </nav>

        <header className="mt-8 border-b border-border pb-10">
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-copper">
            Home style
          </span>
          <h1 className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">
            {style.label}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            {content.tagline}
          </p>
        </header>

        <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {content.facts.map((fact) => (
            <div key={fact.label} className="bg-surface p-5">
              <dt className="text-xs uppercase tracking-wide text-muted-2">
                {fact.label}
              </dt>
              <dd className="mt-2 text-sm font-medium text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <article className="mt-14 space-y-12">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl tracking-tight text-foreground">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-base leading-relaxed text-muted"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <section className="mt-16 rounded-xl border border-border bg-surface p-8">
          <h2 className="font-display text-2xl tracking-tight text-foreground">
            Design your {style.label.toLowerCase()} with Atelier
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Describe the home you want and get a permit-ready floor plan, a site
            plan on your lot, photoreal renders, and transparent pricing — in an
            afternoon, not a quarter.
          </p>
          <Link
            href="/builder/brief"
            className="mt-6 inline-flex items-center rounded-lg bg-copper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-copper-bright"
          >
            Start a brief
          </Link>
        </section>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-display text-xl tracking-tight text-foreground">
            Explore other styles
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {related.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/showcase/${other.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-bright"
                >
                  <span className="text-sm font-medium text-foreground">
                    {other.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-2">
                    {other.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
