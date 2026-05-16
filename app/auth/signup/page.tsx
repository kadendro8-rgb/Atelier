import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Start free",
  description: "Create your Atelier account and design three custom homes free.",
};

export default function SignUpPage() {
  if (!authEnabled) return <AuthForm mode="signup" />;

  return (
    <AuthScreen
      title="Start designing free"
      subtitle="Three custom homes on the house."
    >
      <SignUp
        routing="hash"
        signInUrl="/auth/signin"
        fallbackRedirectUrl="/builder"
        appearance={{ elements: { rootBox: "w-full", cardBox: "w-full" } }}
      />
    </AuthScreen>
  );
}
