import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "Are Atelier's plans actually permit-ready?",
    a: "Atelier produces a coordinated, dimensioned sheet set that validates against the local code edition — egress, spans, stairs, and setbacks included. Most jurisdictions still require a licensed architect or engineer of record to stamp the set, and Atelier exports cleanly into their workflow. It removes the drafting, not the professional sign-off.",
  },
  {
    q: "Do I need to know CAD or architecture software?",
    a: "No. If you can describe a home to a client, you can drive Atelier. The whole interface is a conversation plus direct drag-to-edit on the plan — there is nothing to install and no command line to memorize.",
  },
  {
    q: "Where does the parcel and zoning data come from?",
    a: "Atelier pulls parcel boundaries, setbacks, and easements from county GIS and assessor records across 3,100+ U.S. jurisdictions. When a lot isn't on file you can trace it manually, and Atelier still applies the zoning district's rules to the buildable envelope.",
  },
  {
    q: "How does the client portal collect a deposit?",
    a: "Each project gets a branded portal where your client reviews plans and renders, approves the design, and pays the deposit by card or ACH. Payouts run on Stripe, land in your account, and the portal logs the approval so there's a clear record before the build starts.",
  },
  {
    q: "Can my draftsperson or architect still use their own tools?",
    a: "Yes. Atelier exports DWG, PDF, and IFC, so your existing partners pick up the design in AutoCAD, Revit, or ArchiCAD without re-drawing it. Atelier handles the first 80% — the concept, the iteration, the client buy-in — and hands off a clean file.",
  },
  {
    q: "What happens after my free designs are used up?",
    a: "Your first three designs are free on every plan, with no card required. After that you pick a plan that fits your volume — Solo, Studio, or Firm. Nothing you've already designed is locked away, and you can export everything if you decide not to continue.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            FAQ
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            The questions builders ask first
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
