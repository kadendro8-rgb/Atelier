"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#showcase", label: "Showcase" },
  { href: "/#features", label: "Features" },
  { href: "/#math", label: "The math" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/find-contractor", label: "Find a contractor" },
  { href: "/for-contractors", label: "For contractors" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out",
        scrolled
          ? "border-b border-border bg-ink/80 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-18 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          aria-label="Atelier home"
        >
          <Logo className="size-8 text-copper" />
          <span className="font-display text-xl tracking-tight">Atelier</span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild size="sm">
            <Link href="/builder">
              <Sparkles className="size-4" />
              Start free — 3 designs, no card
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-foreground transition-colors duration-200 hover:bg-surface-2 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu with smooth transition */}
      <div
        className={cn(
          "border-t border-border bg-ink/95 backdrop-blur-xl lg:hidden overflow-hidden transition-all duration-400 ease-out",
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-transparent"
        )}
      >
        <ul className="flex flex-col gap-1 px-5 py-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-base text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <Button asChild size="lg" className="w-full">
              <Link href="/builder" onClick={() => setOpen(false)}>
                <Sparkles className="size-4" />
                Start free — 3 designs, no card
              </Link>
            </Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
