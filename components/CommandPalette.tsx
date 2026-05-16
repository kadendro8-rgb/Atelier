"use client";

/**
 * Global command palette (Cmd/Ctrl+K).
 *
 * Fuzzy-searchable navigation built on `cmdk`. Opens on Cmd/Ctrl+K, closes on
 * Esc, fully keyboard-navigable. See docs/v2-spec.md §6.
 *
 * TODO(v2): extend with undo/redo (Yjs Y.UndoManager), AI revision chat, and
 * dynamic actions (plans, builders, clients) once those kernels land.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  ClipboardList,
  Home,
  Images,
  LayoutDashboard,
  Map,
  Network,
  PenLine,
  Users,
} from "lucide-react";

type CommandAction = {
  /** Stable id, also used as the cmdk search value. */
  id: string;
  label: string;
  /** Extra search terms so fuzzy matching is forgiving. */
  keywords: string[];
  href: string;
  icon: typeof Home;
};

const ACTIONS: readonly CommandAction[] = [
  {
    id: "home",
    label: "Home",
    keywords: ["landing", "start", "overview"],
    href: "/",
    icon: Home,
  },
  {
    id: "builder",
    label: "Builder",
    keywords: ["studio", "design", "create"],
    href: "/builder",
    icon: PenLine,
  },
  {
    id: "builder-brief",
    label: "Builder · Brief",
    keywords: ["brief", "requirements", "program"],
    href: "/builder/brief",
    icon: ClipboardList,
  },
  {
    id: "builder-floor-plan",
    label: "Builder · Floor plan",
    keywords: ["floor", "plan", "layout", "rooms"],
    href: "/builder/floor-plan",
    icon: Map,
  },
  {
    id: "gallery",
    label: "Gallery",
    keywords: ["showcase", "designs", "inspiration"],
    href: "/gallery",
    icon: Images,
  },
  {
    id: "match",
    label: "Builder match",
    keywords: ["match", "find builder", "pairing"],
    href: "/match",
    icon: Users,
  },
  {
    id: "gc-network",
    label: "GC network",
    keywords: ["general contractor", "network", "contractors"],
    href: "/gc-network",
    icon: Network,
  },
  {
    id: "partner-dashboard",
    label: "Partner dashboard",
    keywords: ["partner", "stamp", "architect", "portal"],
    href: "/partner/dashboard",
    icon: LayoutDashboard,
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const runAction = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-[100] flex items-start justify-center"
      overlayClassName="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-sm"
      contentClassName="relative z-[101] mt-[14vh] w-[min(92vw,32rem)]"
    >
      <div className="overflow-hidden rounded-card border border-border-bright bg-surface shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8)]">
        <div className="border-b border-border px-3">
          <Command.Input
            placeholder="Search pages and actions…"
            className="h-13 w-full bg-transparent text-sm text-foreground placeholder:text-muted-2 focus-visible:outline-none"
          />
        </div>
        <Command.List className="max-h-[min(60vh,22rem)] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted-2">
            No matches found.
          </Command.Empty>
          <Command.Group
            heading="Navigate"
            className="text-[10px] font-medium uppercase tracking-wide text-muted-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Command.Item
                  key={action.id}
                  value={`${action.label} ${action.keywords.join(" ")}`}
                  onSelect={() => runAction(action.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-muted transition-colors data-[selected=true]:bg-surface-2 data-[selected=true]:text-foreground"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-copper">
                    <Icon className="size-3.5" />
                  </span>
                  <span className="flex-1 font-medium normal-case tracking-normal text-foreground">
                    {action.label}
                  </span>
                  <span className="font-sans text-[11px] normal-case tracking-normal text-muted-2">
                    {action.href}
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>
        </Command.List>
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-2">
          <span>
            <kbd className="font-sans">↑↓</kbd> to navigate ·{" "}
            <kbd className="font-sans">↵</kbd> to open
          </span>
          <span>
            <kbd className="font-sans">Esc</kbd> to close
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
