import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "Are Atelier's designs accurate enough to build from?",
    a: "Atelier produces a scaled, dimensioned layout with a line-item material takeoff — pavers, base, concrete, square footages, and quantities your crew works straight off of. Where a job needs a permit, like a pool or a structure, Atelier exports cleanly into your engineer's workflow. It removes the drawing, not the professional sign-off where one is required.",
  },
  {
    q: "Do I need to know CAD or design software?",
    a: "No. If you can describe a backyard to a client, you can drive Atelier. The whole interface is a conversation plus direct drag-to-edit on the layout — there is nothing to install and no command line to memorize.",
  },
  {
    q: "Where does the property data come from?",
    a: "Atelier pulls parcel boundaries, setbacks, and the property line from county GIS and assessor records across 3,100+ U.S. jurisdictions. When a lot isn't on file you can trace it manually, and Atelier still scales the design to the real yard.",
  },
  {
    q: "How does the client portal collect a deposit?",
    a: "Each project gets a branded portal where your client reviews the layout and renders, approves the design, and pays the deposit by card or ACH. Payouts run on Stripe, land in your account, and the portal logs the approval so there's a clear record before the job starts.",
  },
  {
    q: "Can I still use my own supplier and takeoff?",
    a: "Yes. Atelier exports the estimate and material list as PDF and CSV, so you can price it through your own supplier or drop it into the takeoff tool you already use. Atelier handles the first 80% — the layout, the iteration, the client buy-in — and hands off clean numbers.",
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
            The questions contractors ask first
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
