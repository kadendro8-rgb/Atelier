import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TRIAL_CTA } from "@/lib/cta";
import { Reveal } from "@/components/Reveal";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-border bg-ink-2 py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_100%,rgba(210,138,85,0.18),transparent_70%)]"
      />
      <div aria-hidden="true" className="bg-grain pointer-events-none absolute inset-0 opacity-50" />

      <Reveal className="relative mx-auto max-w-2xl px-5 text-center sm:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-copper">
          Start today
        </p>
        <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight sm:text-5xl">
          Your next backyard walk-through could end with a signed deposit
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-muted">
          Design three backyards free. If Atelier doesn&apos;t pay for
          itself before the trial ends, you keep the renders anyway.
        </p>

        <div className="mt-9 flex justify-center">
          <Button asChild size="lg">
            <Link href={TRIAL_CTA.href}>
              <Sparkles className="size-4" />
              {TRIAL_CTA.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-2">
          Keyless to explore · No card · Three designs free
        </p>
      </Reveal>
    </section>
  );
}
