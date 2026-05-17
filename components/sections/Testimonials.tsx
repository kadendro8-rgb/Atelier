"use client";

import { Star, Quote } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/Reveal";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  metric?: string;
  metricLabel?: string;
};

const testimonials: Testimonial[] = [
  {
    quote: "We went from a 6-week design cycle to same-day. The client gets excited, signs off, and pays the deposit before they leave the meeting. It changed our whole business model.",
    author: "Marcus Chen",
    role: "Principal",
    company: "North Ridge Construction",
    metric: "6x",
    metricLabel: "faster to deposit",
  },
  {
    quote: "The code validation alone saves us from embarrassing mistakes. Every wall move checks egress, spans, setbacks. My draftsperson picks up a clean file instead of fixing basic errors.",
    author: "Sarah Mitchell",
    role: "Director of Design",
    company: "Bluewater Custom Homes",
    metric: "100%",
    metricLabel: "code-checked edits",
  },
  {
    quote: "I used to outsource drafting at $4,800 a month. Now I do everything in Atelier and export to my architect. The ROI was instant — first month paid for the whole year.",
    author: "James Thornton",
    role: "Owner",
    company: "Hearthstone Builders",
    metric: "$57k",
    metricLabel: "saved per year",
  },
];

const socialProof = [
  { value: "2,400+", label: "Active builders" },
  { value: "24,000+", label: "Homes designed" },
  { value: "98%", label: "Client approval rate" },
  { value: "4.9/5", label: "Average rating" },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
            Testimonials
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Trusted by builders who <span className="text-gradient-copper">ship homes</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            See why leading custom-home builders switched to Atelier.
          </p>
        </Reveal>

        {/* Social proof stats */}
        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {socialProof.map((item) => (
              <div key={item.label} className="text-center">
                <div className="font-display text-3xl tracking-tight text-foreground lg:text-4xl">
                  {item.value}
                </div>
                <p className="mt-1 text-sm text-muted-2">{item.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Testimonial cards */}
        <RevealGroup className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <RevealItem key={t.author}>
              <article className="group relative flex h-full flex-col rounded-2xl border border-border bg-surface p-8 transition-all duration-300 hover:border-border-bright hover:bg-surface-2">
                {/* Quote icon */}
                <Quote className="size-8 text-copper/30" />

                {/* Quote text */}
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-muted">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
                  <div>
                    <p className="font-medium text-foreground">{t.author}</p>
                    <p className="text-sm text-muted-2">
                      {t.role}, {t.company}
                    </p>
                  </div>
                  {t.metric && (
                    <div className="text-right">
                      <p className="font-display text-2xl tracking-tight text-copper">
                        {t.metric}
                      </p>
                      <p className="text-xs text-muted-2">{t.metricLabel}</p>
                    </div>
                  )}
                </div>

                {/* Stars */}
                <div className="mt-4 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-copper text-copper"
                    />
                  ))}
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
