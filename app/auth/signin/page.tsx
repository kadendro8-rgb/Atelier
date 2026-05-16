import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Atelier account.",
};

export default function SignInPage() {
  if (!authEnabled) return <AuthForm mode="signin" />;

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to open the builder."
    >
      <SignIn
        routing="hash"
        signUpUrl="/auth/signup"
        fallbackRedirectUrl="/builder"
        appearance={{ elements: { rootBox: "w-full", cardBox: "w-full" } }}
      />
    </AuthScreen>
  );
}
