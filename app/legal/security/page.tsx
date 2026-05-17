import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/LegalPage";

const UPDATED = "May 17, 2026";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Atelier protects your data: HTTPS encryption in transit, Stripe for PCI-compliant payments, Supabase-backed auth and storage, on-device site photos, and how to report a vulnerability.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      kicker="Trust"
      title="Security"
      intro="A plain account of how Atelier protects your account and your project data — what we run, who we rely on, and how to reach us if you find a problem."
      updated={UPDATED}
    >
      <LegalSection title="Our approach">
        <p>
          Atelier is a small, focused product, and our security posture follows
          from that: collect as little as possible, keep sensitive work close to
          the people who own it, and lean on infrastructure providers who do
          security at a scale we could not match alone. The sections below
          describe how that works in practice.
        </p>
      </LegalSection>

      <LegalSection title="Encryption in transit">
        <p>
          Every connection to Atelier is served over <strong>HTTPS</strong>.
          Traffic between your browser, our site, and our service providers is
          encrypted with TLS, so account details, briefs, and project data
          cannot be read in transit on the networks they cross.
        </p>
      </LegalSection>

      <LegalSection title="Site photos stay on your device">
        <p>
          When you add a photo of a job site in the builder, the image is stored
          locally in your browser using <strong>IndexedDB</strong>. It is never
          uploaded to an Atelier server, so a photo of a client&rsquo;s property
          cannot be exposed by a breach of infrastructure that never held it.
          Photos remain on the device and browser where you added them, and
          clearing your browser storage removes them.
        </p>
      </LegalSection>

      <LegalSection title="Payments are handled by Stripe">
        <p>
          All payments — paid plans and the deposits your clients pay through
          the portal — are processed by <strong>Stripe</strong>. Stripe is a
          PCI-DSS Level 1 service provider, the highest level of payment-card
          security certification. Card numbers are entered into Stripe&rsquo;s
          systems directly; <strong>Atelier never sees or stores full card
          numbers</strong>.
        </p>
      </LegalSection>

      <LegalSection title="Authentication and storage">
        <p>
          Accounts and project persistence are backed by <strong>Supabase</strong>.
          Authentication, session handling, and the database that stores your
          projects run on Supabase&rsquo;s managed infrastructure, with data
          encrypted at rest. You are responsible for keeping your own sign-in
          credentials secure — use a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="Brief processing">
        <p>
          To turn a written brief into a sited design, Atelier sends the brief
          text to <strong>Anthropic&rsquo;s Claude API</strong> over an
          encrypted connection. We send only what is needed to parse the brief —
          not your account identity or your client&rsquo;s personal details.
          Under Anthropic&rsquo;s commercial API terms, that content is not used
          to train models.
        </p>
      </LegalSection>

      <LegalSection title="Data minimization">
        <p>
          The strongest protection for a piece of data is not collecting it. We
          hold an account email and the project work you create, and not much
          else:
        </p>
        <LegalList
          items={[
            "Site photos live only on your device, never on our servers.",
            "We do not store full payment-card numbers — Stripe does.",
            "We do not run third-party advertising trackers.",
            "We do not use your projects, briefs, or photos to train AI models.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Reporting a vulnerability">
        <p>
          If you believe you have found a security vulnerability in Atelier, we
          want to hear from you. Email{" "}
          <a href="mailto:hello@atelier.design">hello@atelier.design</a> with
          &ldquo;Security&rdquo; in the subject line and enough detail to
          reproduce the issue. Please give us a reasonable window to investigate
          and fix the problem before disclosing it publicly.
        </p>
        <p>
          We will acknowledge a credible report, keep you updated as we work
          through it, and we will not pursue good-faith security research that
          respects user privacy and avoids degrading the service for others.
        </p>
      </LegalSection>

      <LegalSection title="Honest limits">
        <p>
          No service can promise perfect security, and we will not pretend
          otherwise. What we can promise is a small attack surface, sensible
          defaults, reliance on serious infrastructure partners, and a fast,
          straight response when something goes wrong.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
