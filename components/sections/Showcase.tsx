"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BedDouble, Ruler, Trees, Clock } from "lucide-react";
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
    beds: "4 bed \u00b7 3 bath",
    lot: "0.61 ac lot",
    turnaround: "7 hrs",
  },
  {
    id: "lake-home",
    label: "Lake Home",
    image: "/showcase/showcase-lake-home.jpg",
    blurb: "Walkout lower level, lake-facing glass, and a screened upper deck.",
    sqft: "3,420 sq ft",
    beds: "5 bed \u00b7 4 bath",
    lot: "1.2 ac waterfront",
    turnaround: "9 hrs",
  },
  {
    id: "courtyard-modern",
    label: "Courtyard Modern",
    image: "/showcase/showcase-courtyard-modern.jpg",
    blurb: "An L-shaped plan wrapped around a private central courtyard.",
    sqft: "3,100 sq ft",
    beds: "4 bed \u00b7 3.5 bath",
    lot: "0.48 ac infill",
    turnaround: "6 hrs",
  },
  {
    id: "mountain-cabin",
    label: "Mountain Cabin",
    image: "/showcase/showcase-mountain-cabin.jpg",
    blurb: "Steep-roof timber frame engineered for 60 psf snow load.",
    sqft: "1,780 sq ft",
    beds: "3 bed \u00b7 2 bath",
    lot: "2.4 ac sloped",
    turnaround: "8 hrs",
  },
  {
    id: "coastal-cottage",
    label: "Coastal Cottage",
    image: "/showcase/showcase-coastal-cottage.jpg",
    blurb: "Elevated pilings, hurricane-rated openings, and deep shaded porch.",
    sqft: "2,210 sq ft",
    beds: "3 bed \u00b7 3 bath",
    lot: "0.33 ac coastal",
    turnaround: "7 hrs",
  },
  {
    id: "desert-contemporary",
    label: "Desert Contemporary",
    image: "/showcase/showcase-desert-contemporary.jpg",
    blurb: "Flat-roof geometry with rammed-earth walls and a courtyard pool.",
    sqft: "2,680 sq ft",
    beds: "3 bed \u00b7 2.5 bath",
    lot: "1.1 ac desert",
    turnaround: "6 hrs",
  },
  {
    id: "craftsman-bungalow",
    label: "Craftsman Bungalow",
    image: "/showcase/showcase-craftsman-bungalow.jpg",
    blurb: "Tapered columns, exposed rafters, and a deep front porch.",
    sqft: "1,920 sq ft",
    beds: "3 bed \u00b7 2 bath",
    lot: "0.28 ac urban",
    turnaround: "5 hrs",
  },
  {
    id: "prairie-ranch",
    label: "Prairie Ranch",
    image: "/showcase/showcase-prairie-ranch.jpg",
    blurb: "Low-pitched hipped roof with strong horizontal bands of glass.",
    sqft: "2,560 sq ft",
    beds: "4 bed \u00b7 3 bath",
    lot: "0.75 ac flat",
    turnaround: "7 hrs",
  },
  {
    id: "hillside-villa",
    label: "Hillside Villa",
    image: "/showcase/showcase-hillside-villa.jpg",
    blurb: "Multi-level plan stepping down the grade with valley views.",
    sqft: "3,800 sq ft",
    beds: "5 bed \u00b7 4.5 bath",
    lot: "1.6 ac sloped",
    turnaround: "10 hrs",
  },
  {
    id: "urban-infill",
    label: "Urban Infill",
    image: "/showcase/showcase-urban-infill.jpg",
    blurb: "Three-story narrow-lot build with a rooftop terrace.",
    sqft: "2,100 sq ft",
    beds: "3 bed \u00b7 2.5 bath",
    lot: "0.08 ac lot",
    turnaround: "5 hrs",
  },
];

const smoothEase = [0.22, 1, 0.36, 1];

export function Showcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const current = projects[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    },
    [activeIndex],
  );

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <section id="showcase" className="scroll-mt-20 border-t border-border py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Section header */}
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-copper">
            Showcase
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            Ten homes, ten styles,{" "}
            <span className="text-gradient-copper">one afternoon each</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Every render below started as a sentence. Pick a style to see what a
            first-pass Atelier design looks like.
          </p>
        </Reveal>

        {/* Tab navigation */}
        <Reveal delay={0.1} className="mt-12">
          <div
            role="tablist"
            className="scrollbar-hide flex gap-2 overflow-x-auto rounded-xl border border-border bg-surface p-1.5"
          >
            {projects.map((p, i) => (
              <button
                key={p.id}
                role="tab"
                aria-selected={i === activeIndex}
                onClick={() => goTo(i)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  i === activeIndex
                    ? "bg-copper text-ink shadow-sm"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Showcase card */}
        <Reveal delay={0.15} className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {/* Main image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={reduceMotion ? undefined : variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5, ease: smoothEase }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.image}
                    alt={`Atelier render \u2014 ${current.label}`}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1200px"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

              {/* Content overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-lg">
                    <motion.h3
                      key={`title-${current.id}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: smoothEase }}
                      className="font-display text-2xl tracking-tight sm:text-3xl"
                    >
                      {current.label}
                    </motion.h3>
                    <motion.p
                      key={`blurb-${current.id}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05, ease: smoothEase }}
                      className="mt-2 text-sm text-muted sm:text-base"
                    >
                      {current.blurb}
                    </motion.p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-border-bright bg-ink/60 px-4 py-2 backdrop-blur-sm">
                    <Clock className="size-4 text-copper" />
                    <span className="text-sm font-medium text-copper-bright">
                      Designed in {current.turnaround}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              {[
                { icon: Ruler, value: current.sqft },
                { icon: BedDouble, value: current.beds },
                { icon: Trees, value: current.lot },
              ].map(({ icon: Icon, value }) => (
                <div
                  key={value}
                  className="flex items-center justify-center gap-3 px-4 py-5 text-center transition-colors duration-300 hover:bg-surface-2"
                >
                  <Icon className="size-5 text-copper" />
                  <span className="text-sm text-muted sm:text-base">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
