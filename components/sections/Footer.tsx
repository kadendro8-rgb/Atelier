import Link from "next/link";
import { Logo } from "@/components/Logo";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Showcase", href: "/#showcase" },
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "Open the builder", href: "/builder" },
    ],
  },
  {
    heading: "For Contractors",
    links: [
      { label: "Project gallery", href: "/gallery" },
      { label: "GC referral network", href: "/for-contractors" },
      { label: "Get matched with clients", href: "/find-contractor" },
      { label: "Partner dashboard", href: "/for-contractors" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/#" },
      { label: "Terms", href: "/#" },
      { label: "Security", href: "/#" },
      { label: "Contact", href: "mailto:support@atelier.design" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_2.5fr]">
          {/* Brand column */}
          <div>
            <Link
              href="/"
              className="flex w-fit items-center gap-2.5"
              aria-label="Atelier home"
            >
              <Logo className="size-8 text-copper" />
              <span className="font-display text-xl tracking-tight">
                Atelier
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              The design studio for outdoor-living contractors. From a backyard
              walk-through to a signed deposit — on a contractor&apos;s timeline.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">
                  {col.heading}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-copper-bright"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-8 text-xs text-muted-2 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} Atelier Design, Inc. All rights reserved.</p>
          <p>Built for the outdoor-living trade.</p>
        </div>
      </div>
    </footer>
  );
}
