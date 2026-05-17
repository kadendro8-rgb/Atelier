import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Twitter, Linkedin, Github } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Features", href: "/#features" },
      { label: "The math", href: "/#math" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Gallery",
    links: [
      { label: "Showcase", href: "/#showcase" },
      { label: "Browse gallery", href: "/gallery" },
      { label: "Custom homes", href: "/gallery?category=custom-homes" },
      { label: "Hardscapes", href: "/gallery?category=hardscapes" },
    ],
  },
  {
    heading: "For Pros",
    links: [
      { label: "Find a contractor", href: "/find-contractor" },
      { label: "For contractors", href: "/for-contractors" },
      { label: "Builder guides", href: "/#" },
      { label: "API", href: "/#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/#" },
      { label: "FAQ", href: "/#faq" },
      { label: "Blog", href: "/#" },
      { label: "Contact", href: "mailto:support@atelier.design" },
      { label: "Privacy", href: "/#" },
      { label: "Terms", href: "/#" },
    ],
  },
];

const socials = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
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
              The design studio for custom-home builders. From a conversation
              to a permit-ready set — on a builder&apos;s timeline.
            </p>
            {/* Social links */}
            <div className="mt-6 flex items-center gap-4">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-border-bright hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
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
          <p>© {new Date().getFullYear()} Atelier Design, Inc. All rights reserved.</p>
          <p>Crafted with precision, built for builders.</p>
        </div>
      </div>
    </footer>
  );
}
