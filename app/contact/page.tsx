import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Atelier — one inbox for sales, support, and security. Email hello@atelier.design and a real person will read it.",
};

const CONTACT_EMAIL = "hello@atelier.design";

export default function ContactPage() {
  return (
    <LegalPage
      kicker="Say hello"
      title="Contact"
      intro="Atelier is built by a small team, and we like hearing from the contractors who use it. One inbox, one real person on the other end."
      updated="May 17, 2026"
    >
      <LegalSection title="Email us">
        <p>
          The fastest way to reach us is email. Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and a person —
          not a bot, not a ticket queue — will read it and write back.
        </p>
      </LegalSection>

      <LegalSection title="What to write about">
        <p>
          The same address works for everything. To help us route your message,
          a quick subject line goes a long way:
        </p>
        <ul className="space-y-3">
          <li className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Sales</span>
            <span>
              Questions about plans, pricing, or whether Atelier fits the way
              your crew works. Happy to walk through it before you commit to
              anything — the first three designs are free regardless.
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Support</span>
            <span>
              Something not working, a design that came out wrong, a question
              about exports or the client portal. Include your account email
              and what you were trying to do.
            </span>
          </li>
          <li className="flex flex-col gap-1">
            <span className="font-semibold text-foreground">Security</span>
            <span>
              Found a vulnerability? Put &ldquo;Security&rdquo; in the subject
              line. See the{" "}
              <Link href="/legal/security">Security page</Link> for what to
              include and how we handle reports.
            </span>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="The fine print">
        <p>
          Atelier is operated by <strong>Atelier Design, Inc.</strong> For data
          and privacy requests, see our{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>; for the rules of
          the road, the <Link href="/legal/terms">Terms of Service</Link>.
        </p>
      </LegalSection>

      <div className="mt-12 rounded-xl border border-border bg-surface-2 p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-muted">
          Not ready to write yet? You can start designing without talking to
          anyone — the builder is keyless and the first three designs are free.
        </p>
        <Link
          href="/builder"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-copper-bright transition-colors hover:text-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
        >
          Open the builder &rarr;
        </Link>
      </div>
    </LegalPage>
  );
}
