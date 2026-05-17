"use client";

/**
 * Step-0 "What are you building?" picker.
 *
 * Renders the `PROJECT_TYPES` registry as a card grid above the lot search.
 * `available` types are selectable; the rest render visibly disabled with a
 * "coming soon" badge. The choice is a controlled value owned by the lot page,
 * which persists it to localStorage.
 */
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
  return (
    <fieldset
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      aria-label="What are you building?"
    >
      {PROJECT_TYPES.map((type) => {
        const selected = type.id === value;
        const locked = !type.available;
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={locked || disabled}
            disabled={locked || disabled}
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
    </fieldset>
  );
}
