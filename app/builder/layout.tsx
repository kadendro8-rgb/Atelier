import type { ReactNode } from "react";
import { StudioErrorBoundary } from "@/components/StudioErrorBoundary";

/**
 * Wraps every `/builder` studio in an error boundary so a render-time crash
 * surfaces a graceful recovery card instead of a blank screen.
 * See docs/v2-spec.md §8.
 */
export default function BuilderLayout({ children }: { children: ReactNode }) {
  return <StudioErrorBoundary>{children}</StudioErrorBoundary>;
}
