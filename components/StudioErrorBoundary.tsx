"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Error boundary for builder studios.
 *
 * TODO(v2-section-8): wrap every studio, report to Sentry, and give the
 * recovery card a hard-reload button that preserves localStorage state.
 * See docs/v2-spec.md §8.1.
 */
export class StudioErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-xl border border-copper/50 bg-surface p-6 text-sm text-muted">
          Something went sideways. Your work is saved — refresh to continue.
        </div>
      );
    }
    return this.props.children;
  }
}
