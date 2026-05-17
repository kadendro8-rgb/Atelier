"use client";

/**
 * Step-0 "What are you building?" picker.
 *
 * Renders the `PROJECT_TYPES` registry as a card grid above the lot search.
 * `available` types are selectable; the rest render visibly disabled with a
 * "coming soon" badge. The choice is a controlled value owned by the lot page,
 * which persists it to localStorage.
 *
 * Accessibility: an ARIA radio group with roving tabindex — one Tab stop, and
 * arrow / Home / End keys move the selection between the available options.
 */
import { useRef } from "react";
import { Check } from "lucide-react";
import { PROJECT_TYPES } from "@/lib/project-types";
import type { ProjectType } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export function ProjectTypePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: ProjectType;
  onChange: (next: ProjectType) => void;
  disabled?: boolean;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  // The selectable (available) types, in registry order — the set the arrow
  // keys cycle through.
  const selectable = PROJECT_TYPES.filter((t) => t.available);

  /**
   * Roving-tabindex keyboard handler. Arrow keys move the selection to the
   * next/previous available type and focus its card; Home/End jump to the
   * ends. Mirrors the WAI-ARIA radio-group pattern.
   */
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled || selectable.length === 0) return;
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const currentIndex = Math.max(
      0,
      selectable.findIndex((t) => t.id === value),
    );
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % selectable.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + selectable.length) % selectable.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = selectable.length - 1;
    }
    const next = selectable[nextIndex];
    if (!next) return;
    onChange(next.id);
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-type="${next.id}"]`)
      ?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      aria-label="What are you building?"
    >
      {PROJECT_TYPES.map((type) => {
        const selected = type.id === value;
        const locked = !type.available;
        // Roving tabindex — only the selected card is in the tab order; the
        // rest are reached with the arrow keys.
        const tabIndex = locked || disabled ? -1 : selected ? 0 : -1;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            data-type={type.id}
            aria-checked={selected}
            aria-disabled={locked || disabled}
            disabled={locked || disabled}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            onClick={() => !locked && !disabled && onChange(type.id)}
            className={cn(
              "group relative flex flex-col rounded-card border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/30",
              selected
                ? "border-copper bg-copper/10"
                : "border-border bg-surface hover:border-border-bright",
              locked &&
                "cursor-not-allowed opacity-55 hover:border-border",
              disabled && !locked && "opacity-60",
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "font-display text-sm tracking-tight",
                  selected ? "text-copper-bright" : "text-foreground",
                )}
              >
                {type.label}
              </span>
              {selected && (
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-copper text-ink">
                  <Check className="size-2.5" />
                </span>
              )}
              {locked && (
                <span className="shrink-0 rounded-full border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-2">
                  Soon
                </span>
              )}
            </span>
            <span className="mt-1 text-xs leading-snug text-muted">
              {type.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
