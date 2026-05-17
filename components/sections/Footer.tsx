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
    heading: "For contractors",
    links: [
      { label: "Project gallery", href: "/gallery" },
      { label: "GC referral network", href: "/gc-network" },
      { label: "Get matched with clients", href: "/match" },
      { label: "Partner dashboard", href: "/partner/dashboard" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Security", href: "/legal/security" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2.5fr]">
          <div>
            <Link
              href="/"
              className="flex w-fit items-center gap-2.5"
              aria-label="Atelier home"
            >
              <Logo className="size-7 text-copper" />
              <span className="font-display text-lg tracking-tight">
                Atelier
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The design studio for outdoor-living contractors. From a
              backyard walk-through to a signed deposit — on a
              contractor&apos;s timeline.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-2">
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-2.5">
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

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-2 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Atelier Design, Inc. All rights reserved.</p>
          <p>Built for the outdoor-living trade.</p>
        </div>
      </div>
    </footer>
  );
}
