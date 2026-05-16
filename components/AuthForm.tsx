import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

type AuthFormProps = {
  mode: "signin" | "signup";
};

const copy = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to pick up where your last design left off.",
    cta: "Sign in",
    switchText: "New to Atelier?",
    switchLink: "/auth/signup",
    switchLabel: "Create an account",
  },
  signup: {
    title: "Start designing free",
    subtitle: "Three custom homes on the house. No card required.",
    cta: "Create account",
    switchText: "Already have an account?",
    switchLink: "/auth/signin",
    switchLabel: "Sign in",
  },
} as const;

export function AuthForm({ mode }: AuthFormProps) {
  const c = copy[mode];

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

        <div className="rounded-card border border-border bg-surface p-7">
          <Logo className="size-8 text-copper" />
          <h1 className="mt-5 font-display text-2xl tracking-tight">
            {c.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{c.subtitle}</p>

          {/* Stub form — wired to the product in a later milestone */}
          <form className="mt-6 space-y-4" aria-label={c.title}>
            {mode === "signup" && (
              <Field id="name" label="Full name" type="text" placeholder="Dana Marlowe" autoComplete="name" />
            )}
            <Field
              id="email"
              label="Work email"
              type="email"
              placeholder="you@buildco.com"
              autoComplete="email"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />

            <Button type="button" className="w-full" size="lg">
              {c.cta}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-muted-2">
            This is a preview build — the form is not yet connected.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {c.switchText}{" "}
          <Link
            href={c.switchLink}
            className="font-medium text-copper-bright hover:underline"
          >
            {c.switchLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 w-full rounded-lg border border-border bg-ink px-3.5 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
      />
    </div>
  );
}
