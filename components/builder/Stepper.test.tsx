// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { STEP_ORDER, Stepper } from "./Stepper";

afterEach(cleanup);

/* -------------------------------------------------------------------------- */
/* Rendering                                                                  */
/* -------------------------------------------------------------------------- */

describe("Stepper — rendering", () => {
  it("renders a button for every step in order", () => {
    render(<Stepper current="brief" onNavigate={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(STEP_ORDER.length);
    for (const step of STEP_ORDER) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
  });

  it("marks the current step with aria-current=step", () => {
    render(<Stepper current="site" onNavigate={() => {}} />);
    const current = screen.getByRole("button", { name: /site/i });
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("flags exactly one step as current", () => {
    render(<Stepper current="plan" onNavigate={() => {}} />);
    const flagged = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-current") === "step");
    expect(flagged).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Reachability                                                               */
/* -------------------------------------------------------------------------- */

describe("Stepper — reachability", () => {
  it("enables the current step and everything before it", () => {
    render(<Stepper current="site" onNavigate={() => {}} />);
    for (const key of ["brief", "plan", "site"]) {
      expect(screen.getByRole("button", { name: new RegExp(key, "i") })).toBeEnabled();
    }
  });

  it("disables steps that come after the current one", () => {
    render(<Stepper current="site" onNavigate={() => {}} />);
    for (const key of ["renders", "portal"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(key, "i") }),
      ).toBeDisabled();
    }
  });

  it("enables every step when the last step is current", () => {
    render(<Stepper current="portal" onNavigate={() => {}} />);
    for (const b of screen.getAllByRole("button")) {
      expect(b).toBeEnabled();
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

describe("Stepper — navigation", () => {
  it("calls onNavigate with the step key for a reachable step", () => {
    const onNavigate = vi.fn();
    render(<Stepper current="renders" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /floor plan/i }));
    expect(onNavigate).toHaveBeenCalledWith("plan");
  });

  it("does not navigate when an unreachable step is clicked", () => {
    const onNavigate = vi.fn();
    render(<Stepper current="brief" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: /portal/i }));
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
