import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Atelier account.",
};

export default function SignInPage() {
  return <AuthForm mode="signin" />;
}
