"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#showcase", label: "Showcase" },
  { href: "/#features", label: "Features" },
  { href: "/#math", label: "The math" },
  { href: "/#pricing", label: "Pricing" },
];

export function Nav({ authEnabled = false }: { authEnabled?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          aria-label="Atelier home"
        >
          <Logo className="size-7 text-copper" />
          <span className="font-display text-lg tracking-tight">Atelier</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {authEnabled ? (
            <>
              <Show when="signed-out">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/signup">Start free</Link>
                </Button>
              </Show>
              <Show when="signed-in">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/builder">Open builder</Link>
                </Button>
                <UserButton />
              </Show>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Start free</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-ink/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1 px-5 py-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex gap-2">
              {authEnabled ? (
                <>
                  <Show when="signed-out">
                    <Button asChild variant="subtle" size="sm" className="flex-1">
                      <Link href="/auth/signin" onClick={() => setOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/auth/signup" onClick={() => setOpen(false)}>
                        Start free
                      </Link>
                    </Button>
                  </Show>
                  <Show when="signed-in">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/builder" onClick={() => setOpen(false)}>
                        Open builder
                      </Link>
                    </Button>
                  </Show>
                </>
              ) : (
                <>
                  <Button asChild variant="subtle" size="sm" className="flex-1">
                    <Link href="/auth/signin" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link href="/auth/signup" onClick={() => setOpen(false)}>
                      Start free
                    </Link>
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
