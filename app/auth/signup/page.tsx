import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Start free",
  description: "Create your Atelier account and design three custom homes free.",
};

export default function SignUpPage() {
  return <AuthForm mode="signup" />;
}
