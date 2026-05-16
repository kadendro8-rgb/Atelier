"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

type CountUpProps = {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  /** Group digits with commas, e.g. 12,400 */
  separator?: boolean;
};

function format(value: number, decimals: number, separator: boolean) {
  const fixed = value.toFixed(decimals);
  if (!separator) return fixed;
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
}

export function CountUp({
  to,
  from = 0,
  duration = 1.8,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  separator = false,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const reduceMotion = useReducedMotion();

  const count = useMotionValue(from);
  const display = useTransform(count, (v) =>
    `${prefix}${format(v, decimals, separator)}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      count.set(to);
      return;
    }
    const controls = animate(count, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, reduceMotion, count, to, duration]);

  return (
    <motion.span ref={ref} className={className} aria-label={`${prefix}${format(to, decimals, separator)}${suffix}`}>
      <motion.span aria-hidden="true">{display}</motion.span>
    </motion.span>
  );
}
