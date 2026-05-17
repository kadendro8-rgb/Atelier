"use client";

/**
 * Sign in / Create account — email + password.
 *
 * A single page that toggles between signing in and creating an account,
 * calling `supabase.auth.signInWithPassword` / `signUp` on the browser client.
 * On a confirmed sign-in it redirects to `/builder`; on sign-up it shows a
 * "check your email" success state (email confirmation links resolve through
 * `app/auth/callback`).
 *
 * Keyless-safe: when Supabase auth isn't configured the form is replaced with
 * a calm "authentication isn't configured" notice rather than crashing.
 */
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();

  // DECISION: build the client once per mount via useMemo — `getSupabaseBrowser`
  // is cheap but stable identity keeps the keyless branch from re-evaluating.
  const supabase = useMemo(() => getSupabaseBrowser(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  // --- Keyless fallback ----------------------------------------------------
  if (!supabase) {
    return (
      <AuthShell title="Authentication isn't configured">
        <p className="text-sm leading-relaxed text-muted">
          Sign-in needs Supabase credentials, which aren&apos;t set in this
          environment. The rest of Atelier works without an account — you can
          head straight into the builder.
        </p>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={() => router.push("/builder")}
        >
          Open the builder <ArrowRight className="size-4" />
        </Button>
      </AuthShell>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        // When email confirmation is on, no session is returned — prompt the
        // user to check their inbox. When it's off, a session is live now.
        if (data.session) {
          router.push("/builder");
          router.refresh();
        } else {
          setConfirmSent(true);
        }
      } else {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push("/builder");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Success: confirmation email sent ------------------------------------
  if (confirmSent) {
    return (
      <AuthShell title="Check your inbox">
        <p className="text-sm leading-relaxed text-muted">
          We sent a confirmation link to{" "}
          <span className="text-foreground">{email.trim()}</span>. Open it to
          finish creating your account — it&apos;ll bring you straight back
          here.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmSent(false);
            setMode("signin");
          }}
          className="mt-6 text-sm text-muted-2 underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  const isSignup = mode === "signup";

  return (
    <AuthShell
      title={isSignup ? "Create your account" : "Welcome back"}
      subtitle={
        isSignup
          ? "Start designing custom homes in an afternoon."
          : "Sign in to pick up where you left off."
      }
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Field
          icon={<Mail className="size-4" />}
          label="Email"
          htmlFor="email"
        >
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            placeholder="you@studio.com"
            className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30 disabled:opacity-60"
          />
        </Field>

        <Field
          icon={<Lock className="size-4" />}
          label="Password"
          htmlFor="password"
        >
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-2 transition-colors focus-visible:border-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30 disabled:opacity-60"
          />
        </Field>

        {error && (
          <p className="text-xs text-copper-bright" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="mt-1 w-full"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {isSignup ? "Creating account…" : "Signing in…"}
            </>
          ) : (
            <>
              {isSignup ? "Create account" : "Sign in"}
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isSignup ? "Already have an account?" : "New to Atelier?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(isSignup ? "signin" : "signup");
            setError(null);
          }}
          className="text-copper underline-offset-4 transition-colors hover:text-copper-bright hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </AuthShell>
  );
}

/** Centered card shell shared by every state of the page. */
function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="main"
      className="grid min-h-screen place-items-center bg-ink px-5 py-16"
    >
      <div className="w-full max-w-sm">
        <div className="rounded-card border border-border bg-surface p-7 shadow-xl">
          <h1 className="font-display text-2xl tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}

/** Labelled input wrapper with a leading icon. */
function Field({
  icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-2">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
