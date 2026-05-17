"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BedDouble, Ruler, Trees, Clock, ChevronLeft, ChevronRight } from "lucide-react";
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
    blurb: "A four-bed single story with a vaulted great room and wraparound porch.",
    sqft: "2,940 sq ft",
    beds: "4 bed, 3 bath",
    lot: "0.61 ac lot",
    turnaround: "7 hrs",
  },
  {
    id: "lake-home",
    label: "Lake Home",
    image: "/showcase/showcase-lake-home.jpg",
    blurb: "Walkout lower level, lake-facing glass, and a screened upper deck.",
    sqft: "3,420 sq ft",
    beds: "5 bed, 4 bath",
    lot: "1.2 ac waterfront",
    turnaround: "9 hrs",
  },
  {
    id: "courtyard-modern",
    label: "Courtyard Modern",
    image: "/showcase/showcase-courtyard-modern.jpg",
    blurb: "An L-shaped plan wrapped around a private central courtyard.",
    sqft: "3,100 sq ft",
    beds: "4 bed, 3.5 bath",
    lot: "0.48 ac infill",
    turnaround: "6 hrs",
  },
  {
    id: "mountain-cabin",
    label: "Mountain Cabin",
    image: "/showcase/showcase-mountain-cabin.jpg",
    blurb: "Steep-roof timber frame engineered for 60 psf snow load.",
    sqft: "1,780 sq ft",
    beds: "3 bed, 2 bath",
    lot: "2.4 ac sloped",
    turnaround: "8 hrs",
  },
  {
    id: "coastal-cottage",
    label: "Coastal Cottage",
    image: "/showcase/showcase-coastal-cottage.jpg",
    blurb: "Elevated pilings, hurricane-rated openings, and deep shaded porch.",
    sqft: "2,210 sq ft",
    beds: "3 bed, 3 bath",
    lot: "0.33 ac coastal",
    turnaround: "7 hrs",
  },
];

// Smooth easing for natural transitions
const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Showcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const current = projects[activeIndex];

  const goNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % projects.length);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((i) => (i - 1 + projects.length) % projects.length);
  }, []);

  const goTo = useCallback((index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }, [activeIndex]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
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
            Every style, <span className="text-gradient-copper">one afternoon</span>
          </h2>
          <p className="mt-5 text-lg text-muted">
            Each render below started as a sentence. See what a first-pass Atelier 
            design looks like across different architectural styles.
          </p>
        </Reveal>

        {/* Showcase carousel */}
        <Reveal delay={0.15} className="mt-16">
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
                    alt={`Atelier render — ${current.label}`}
                    fill
                    sizes="(max-width: 1280px) 100vw, 1200px"
                    className="object-cover"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Gradient overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

              {/* Navigation arrows */}
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-border-bright bg-ink/80 text-foreground backdrop-blur transition-all duration-300 hover:bg-surface-2 hover:scale-105"
                aria-label="Previous project"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-border-bright bg-ink/80 text-foreground backdrop-blur transition-all duration-300 hover:bg-surface-2 hover:scale-105"
                aria-label="Next project"
              >
                <ChevronRight className="size-5" />
              </button>

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
                  <div className="flex items-center gap-2">
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

        {/* Thumbnail navigation */}
        <Reveal delay={0.2} className="mt-6">
          <div className="flex justify-center gap-3">
            {projects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => goTo(i)}
                className={`relative h-16 w-24 overflow-hidden rounded-lg border transition-all duration-300 sm:h-20 sm:w-32 ${
                  i === activeIndex
                    ? "border-copper ring-2 ring-copper/30 scale-105"
                    : "border-border hover:border-border-bright hover:scale-102"
                }`}
                aria-label={`View ${p.label}`}
              >
                <Image
                  src={p.image}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
