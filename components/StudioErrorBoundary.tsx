"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Error boundary for builder studios.
 *
 * Wraps every studio (see `app/builder/layout.tsx`) and, on a render-time
 * crash, swaps in a graceful recovery card. The card offers a hard route
 * reload — `location.reload()` re-fetches the document while leaving
 * `localStorage` (the persisted brief / lot / plan) intact, so the user's
 * work survives the recovery. See docs/v2-spec.md §8.
 */
export class StudioErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  private handleReload = () => {
    // Hard reload of the current route. localStorage is untouched, so the
    // saved design state is preserved across the recovery.
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 flex flex-col items-start gap-4 rounded-xl border border-copper/50 bg-surface p-6 text-sm">
          <div className="flex flex-col gap-1.5">
            <p className="font-medium text-foreground">
              Something went sideways.
            </p>
            <p className="text-muted">
              Your work is saved — reload to pick up where you left off.
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded-lg bg-copper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-copper/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
