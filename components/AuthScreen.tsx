import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

/** Branded dark shell for the auth routes — wraps Clerk's SignIn/SignUp. */
export function AuthScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(50%_60%_at_50%_0%,rgba(210,138,85,0.14),transparent_70%)]"
      />
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>

        <div className="mb-6 flex items-center gap-2.5">
          <Logo className="size-8 text-copper" />
          <div>
            <h1 className="font-display text-xl leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
