import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, LegalList } from "@/components/LegalPage";

const UPDATED = "May 17, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Atelier — the keyless design builder for outdoor-living contractors. Three free designs, plain-spoken acceptable use, and clear disclaimers on planning tools and permits.",
};

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms of Service"
      intro="These terms govern your use of Atelier. They are written to be read — no surprises buried in the fine print."
      updated={UPDATED}
    >
      <LegalSection title="1. Agreement">
        <p>
          By using Atelier you agree to these Terms of Service. Atelier is
          operated by <strong>Atelier Design, Inc.</strong>{" "}
          (&ldquo;Atelier,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;). If you are
          using Atelier on behalf of a company, you confirm you are authorized
          to accept these terms for that company.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          Atelier is a keyless design builder for outdoor-living and hardscape
          contractors. It turns a site photo and a written brief into a scaled
          design, a line-item cost estimate, photoreal renders, and a
          client-portal deliverable that can collect a deposit.
        </p>
      </LegalSection>

      <LegalSection title="3. Free designs and plans">
        <p>
          The builder is free to try. Every account gets its{" "}
          <strong>first three designs free</strong>, with no card required.
          After that, continued use is on a paid plan — Solo, Studio, or Firm —
          sized to your volume. Work you have already created is not locked
          away; you can export your designs and estimates if you choose not to
          continue on a paid plan. Plan pricing and limits are described on the{" "}
          <Link href="/#pricing">pricing section</Link> of the site.
        </p>
      </LegalSection>

      <LegalSection title="4. Designs and estimates are planning tools">
        <p>
          Atelier produces a scaled, dimensioned layout and a material takeoff
          your crew can work from. Generated plans, layouts, renders, and cost
          estimates are <strong>planning tools</strong>. They are not
          engineered construction documents and are not a substitute for
          professional judgment.
        </p>
        <p>
          Where a job requires a permit — for example a pool, a retaining wall
          above a regulated height, or a structure — a{" "}
          <strong>
            licensed professional of record must still review, stamp, and sign
            off
          </strong>{" "}
          on the work before it is built. Atelier removes the drafting, not the
          professional sign-off where one is required. Estimates are good-faith
          approximations; final pricing depends on your suppliers, site
          conditions, and local costs, and is your responsibility to confirm.
        </p>
      </LegalSection>

      <LegalSection title="5. Your account">
        <p>
          You are responsible for your account and for keeping your sign-in
          credentials secure. Keep your contact email current so we can reach
          you about your account.
        </p>
      </LegalSection>

      <LegalSection title="6. Your content">
        <p>
          You keep ownership of the briefs, designs, photos, and other content
          you create or upload (&ldquo;Your Content&rdquo;). You grant Atelier a
          limited license to host and process Your Content solely to provide the
          service to you — for example, saving a project so you can return to
          it. We do not use Your Content to train AI models, and we do not sell
          it. You are responsible for having the rights to any content you
          upload.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>When using Atelier, you agree not to:</p>
        <LegalList
          items={[
            "Use the service for any unlawful purpose or to violate anyone's rights.",
            "Upload content you do not have the right to use, or content that is infringing, deceptive, or harmful.",
            "Misrepresent a generated design as a stamped, engineered, or permit-ready document where it is not.",
            "Attempt to break, overload, scrape, or reverse-engineer the service or its security.",
            "Resell or white-label the service without our written permission.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Payments and deposits">
        <p>
          Paid plans and client deposits are processed by Stripe. By making or
          collecting a payment through Atelier, you also agree to Stripe&rsquo;s
          terms. Plan fees are billed in advance and are non-refundable except
          where required by law. When you use the client portal to collect a
          deposit from your own customer, the agreement on that deposit is
          between you and your customer — Atelier provides the tooling, not the
          contract.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-party services">
        <p>
          Atelier relies on third-party providers — including Anthropic, Stripe,
          Supabase, and Vercel — to deliver parts of the service. Their
          availability and terms are outside our control, and your use of those
          features is also subject to their terms.
        </p>
      </LegalSection>

      <LegalSection title="10. Warranty disclaimer">
        <p>
          Atelier is provided <strong>&ldquo;as is&rdquo;</strong> and{" "}
          <strong>&ldquo;as available.&rdquo;</strong> To the fullest extent
          permitted by law, we disclaim all warranties, express or implied,
          including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that the service will be
          uninterrupted, error-free, or that any design or estimate will be
          accurate for your specific site or jurisdiction.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Atelier and Atelier Design,
          Inc. will not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or for lost profits, lost revenue,
          or construction costs arising from your use of the service. Our total
          liability for any claim is limited to the amount you paid Atelier in
          the twelve months before the claim.
        </p>
      </LegalSection>

      <LegalSection title="12. Suspension and termination">
        <p>
          You can stop using Atelier at any time. We may suspend or terminate an
          account that violates these terms or creates risk for the service or
          other users. If we terminate your account without cause, you may
          export your work first where reasonably possible.
        </p>
      </LegalSection>

      <LegalSection title="13. Changes to these terms">
        <p>
          We may update these terms as the product evolves. When we do, we will
          change the date at the top of this page. Continued use of Atelier
          after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          Questions about these terms go to{" "}
          <a href="mailto:hello@atelier.design">hello@atelier.design</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
