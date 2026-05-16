"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BedDouble, Ruler, Trees } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/Reveal";

type Project = {
  id: string;
  label: string;
  image: string;
  blurb: string;
  sqft: string;
  beds: string;
  lot: string;
  turnaround: string;
};

const projects: Project[] = [
  {
    id: "modern-farmhouse",
    label: "Modern Farmhouse",
    image: "/showcase/showcase-modern-farmhouse.jpg",
    blurb: "A four-bed single story with a vaulted great room and a wraparound porch.",
    sqft: "2,940 sq ft",
    beds: "4 bed · 3 bath",
    lot: "0.61 ac lot",
    turnaround: "Designed in 7 hrs",
  },
  {
    id: "lake-home",
    label: "Lake Home",
    image: "/showcase/showcase-lake-home.jpg",
    blurb: "Walkout lower level, lake-facing glass, and a screened upper deck.",
    sqft: "3,420 sq ft",
    beds: "5 bed · 4 bath",
    lot: "1.2 ac waterfront",
    turnaround: "Designed in 9 hrs",
  },
  {
    id: "courtyard-modern",
    label: "Courtyard Modern",
    image: "/showcase/showcase-courtyard-modern.jpg",
    blurb: "An L-shaped plan wrapped around a private central courtyard.",
    sqft: "3,100 sq ft",
    beds: "4 bed · 3.5 bath",
    lot: "0.48 ac infill",
    turnaround: "Designed in 6 hrs",
  },
  {
    id: "mountain-cabin",
    label: "Mountain Cabin",
    image: "/showcase/showcase-mountain-cabin.jpg",
    blurb: "Steep-roof timber frame engineered for a 60 psf snow load.",
    sqft: "1,780 sq ft",
    beds: "3 bed · 2 bath",
    lot: "2.4 ac sloped",
    turnaround: "Designed in 8 hrs",
  },
  {
    id: "coastal-cottage",
    label: "Coastal Cottage",
    image: "/showcase/showcase-coastal-cottage.jpg",
    blurb: "Elevated pilings, hurricane-rated openings, and a deep shaded porch.",
    sqft: "2,210 sq ft",
    beds: "3 bed · 3 bath",
    lot: "0.33 ac coastal",
    turnaround: "Designed in 7 hrs",
  },
  {
    id: "desert-contemporary",
    label: "Desert Contemporary",
    image: "/showcase/showcase-desert-contemporary.jpg",
    blurb: "Low-slope roofs, deep overhangs, and a shaded ramada off the kitchen.",
    sqft: "2,680 sq ft",
    beds: "3 bed · 2.5 bath",
    lot: "0.9 ac desert",
    turnaround: "Designed in 6 hrs",
  },
  {
    id: "craftsman-bungalow",
    label: "Craftsman Bungalow",
    image: "/showcase/showcase-craftsman-bungalow.jpg",
    blurb: "Tapered columns, exposed rafter tails, and a built-in entry bench.",
    sqft: "1,960 sq ft",
    beds: "3 bed · 2 bath",
    lot: "0.21 ac in-town",
    turnaround: "Designed in 5 hrs",
  },
  {
    id: "prairie-ranch",
    label: "Prairie Ranch",
    image: "/showcase/showcase-prairie-ranch.jpg",
    blurb: "A long, low horizontal massing with a split-bedroom layout.",
    sqft: "2,500 sq ft",
    beds: "4 bed · 3 bath",
    lot: "1.8 ac rural",
    turnaround: "Designed in 7 hrs",
  },
  {
    id: "hillside-villa",
    label: "Hillside Villa",
    image: "/showcase/showcase-hillside-villa.jpg",
    blurb: "A three-level stepped plan that follows a 22% downhill grade.",
    sqft: "4,050 sq ft",
    beds: "5 bed · 5 bath",
    lot: "1.1 ac hillside",
    turnaround: "Designed in 11 hrs",
  },
  {
    id: "urban-infill",
    label: "Urban Infill",
    image: "/showcase/showcase-urban-infill.jpg",
    blurb: "A narrow three-story plan with a rooftop terrace and a ground ADU.",
    sqft: "2,340 sq ft",
    beds: "3 bed · 3 bath",
    lot: "0.09 ac infill",
    turnaround: "Designed in 6 hrs",
  },
];

export function Showcase() {
  const [active, setActive] = useState(projects[0].id);
  const reduceMotion = useReducedMotion();
  const current = projects.find((p) => p.id === active) ?? projects[0];

  return (
    <section id="showcase" className="scroll-mt-20 border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-copper">
            Showcase
          </p>
          <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
            Ten homes, ten styles, one afternoon each
          </h2>
          <p className="mt-4 text-muted">
            Every render below started as a sentence. Pick a style to see what
            a first-pass Atelier design looks like.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <Tabs value={active} onValueChange={setActive} className="w-full">
            <TabsList className="mx-auto flex">
              {projects.map((p) => (
                <TabsTrigger key={p.id} value={p.id}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </Reveal>

        <Reveal delay={0.15} className="mt-8">
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="relative aspect-[16/9] w-full">
              <AnimatePresence mode="sync">
                <motion.div
                  key={current.id}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.image}
                    alt={`Atelier render — ${current.label}`}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1200px"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
                <div className="max-w-md">
                  <h3 className="font-display text-2xl tracking-tight">
                    {current.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{current.blurb}</p>
                </div>
                <span className="w-fit rounded-full border border-copper/40 bg-ink/80 px-3 py-1 text-xs text-copper-bright backdrop-blur">
                  {current.turnaround}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              {[
                { icon: Ruler, value: current.sqft },
                { icon: BedDouble, value: current.beds },
                { icon: Trees, value: current.lot },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center justify-center gap-2 px-3 py-4 text-center text-xs text-muted sm:text-sm"
                >
                  <Icon className="size-4 shrink-0 text-copper" />
                  {value}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
