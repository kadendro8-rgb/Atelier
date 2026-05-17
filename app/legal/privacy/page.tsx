import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/LegalPage";

const UPDATED = "May 17, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Atelier handles your data: account and project info, on-device site photos, brief processing with Claude, payments through Stripe. We do not sell data or train AI on your content.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy Policy"
      intro="Atelier is a design tool for outdoor-living contractors. This policy explains, in plain terms, what we collect, where it lives, and what we will never do with it."
      updated={UPDATED}
    >
      <LegalSection title="The short version">
        <p>
          We collect the minimum we need to run the product: an account so you
          can come back to your work, and the project data you create inside
          the builder. <strong>We do not sell your data.</strong>{" "}
          <strong>
            We do not use your projects, briefs, or photos to train AI models.
          </strong>{" "}
          Site photos you capture stay on your own device — they are never
          uploaded to our servers.
        </p>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          Atelier is operated by Atelier Design, Inc. (&ldquo;Atelier,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;). If you have a question about this
          policy or your data, write to us at{" "}
          <a href="mailto:hello@atelier.design">hello@atelier.design</a>.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <LegalList
          items={[
            <>
              <strong>Account information.</strong> When you create an account,
              we collect your email address and authentication details so you
              can sign in and return to your projects.
            </>,
            <>
              <strong>Project data.</strong> The designs, layouts, briefs,
              estimates, and client-portal deliverables you create in the
              builder. This is the work product Atelier exists to save for you.
            </>,
            <>
              <strong>Design briefs.</strong> The written description of a job
              you provide. We send brief text to Anthropic&rsquo;s Claude API so
              it can be parsed into a structured design — see &ldquo;How your
              brief is processed&rdquo; below.
            </>,
            <>
              <strong>Payment information.</strong> When you or your client pay
              a deposit, payment is processed by Stripe. Atelier never sees or
              stores full card numbers.
            </>,
            <>
              <strong>Basic usage data.</strong> Standard, privacy-respecting
              analytics about page performance so we can keep the site fast. We
              do not build advertising profiles.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Site photos stay on your device">
        <p>
          When you capture or upload a photo of a job site in the builder, that
          image is stored locally in your browser using{" "}
          <strong>IndexedDB</strong>. It is not uploaded to an Atelier server,
          and we never receive a copy of it. Photos remain available on the
          device and browser where you added them, and clearing your browser
          storage will remove them. If you need a photo on another device, you
          re-add it there.
        </p>
      </LegalSection>

      <LegalSection title="How your brief is processed">
        <p>
          To turn a written brief into a sited design, Atelier sends the brief
          text to <strong>Anthropic&rsquo;s Claude API</strong>. Anthropic
          processes the request to return a structured result and, under its
          commercial API terms, does not use that content to train its models.
          We send only what is needed to parse the brief — not your account
          identity or your client&rsquo;s personal details.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>We rely on a small set of trusted infrastructure providers:</p>
        <LegalList
          items={[
            <>
              <strong>Supabase</strong> — account authentication and the
              database that persists your projects.
            </>,
            <>
              <strong>Stripe</strong> — deposit and payment processing. Stripe
              is a PCI-DSS Level 1 service provider and handles card data
              directly.
            </>,
            <>
              <strong>Anthropic</strong> — the Claude API that parses design
              briefs.
            </>,
            <>
              <strong>Vercel</strong> — hosting and content delivery for the
              site.
            </>,
          ]}
        />
        <p>
          These providers process data only to deliver their part of the
          service, under their own terms and security commitments.
        </p>
      </LegalSection>

      <LegalSection title="What we do not do">
        <LegalList
          items={[
            "We do not sell or rent your personal information.",
            "We do not use your projects, briefs, or photos to train AI models.",
            "We do not share your project data with other contractors or clients unless you choose to publish a client portal.",
            "We do not run third-party advertising trackers on the site.",
          ]}
        />
      </LegalSection>

      <LegalSection title="How long we keep data">
        <p>
          We keep your account and project data for as long as your account is
          active so your work is there when you return. Site photos live only
          on your device and are governed by your own browser storage. You can
          ask us to delete your account and the project data associated with it
          at any time.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can access and edit your projects from inside the builder. To
          request a copy of your account data or to delete your account, email{" "}
          <a href="mailto:hello@atelier.design">hello@atelier.design</a> and we
          will take care of it. Depending on where you live, you may have
          additional rights under laws such as the GDPR or CCPA; we honor those
          requests regardless of location.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Atelier is a tool for professional contractors and is not intended
          for anyone under 18. We do not knowingly collect data from children.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we make a meaningful change to how we handle data, we will update
          the date at the top of this page and, where appropriate, notify you
          directly. Continued use of Atelier after a change means you accept the
          updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy go to{" "}
          <a href="mailto:hello@atelier.design">hello@atelier.design</a>. We
          read every message.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
