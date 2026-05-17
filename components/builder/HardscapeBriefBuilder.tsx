"use client";

/**
 * Structured brief builder for hardscape projects.
 *
 * Unlike the home flow's free-text box, a `HardscapeBrief` is structured: a
 * list of element requests (kind + material + target size) plus decor toggles.
 * This component is the tactile editor for that — add/remove elements, pick a
 * material per element, slide a target size, toggle the banded border and
 * medallion inlay — and it always emits a valid `HardscapeBrief`.
 *
 * The parent owns the brief state and persistence; this is a controlled
 * component. `prefers-reduced-motion` is respected throughout.
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layers, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  ELEMENT_KINDS,
  MATERIALS,
  kindInfo,
  materialInfo,
} from "@/lib/hardscape/builder";
import type {
  HardscapeBrief,
  HardscapeElementKind,
  HardscapeElementRequest,
  HardscapeMaterial,
} from "@/lib/hardscape/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export function HardscapeBriefBuilder({
  brief,
  onChange,
}: {
  brief: HardscapeBrief;
  onChange: (next: HardscapeBrief) => void;
}) {
  const reduce = useReducedMotion();

  const setElements = (elements: HardscapeElementRequest[]) =>
    onChange({ ...brief, elements });

  const addElement = (kind: HardscapeElementKind) => {
    const info = kindInfo(kind);
    setElements([
      ...brief.elements,
      { kind, material: "broom-finish", targetSqft: info.defaultSqft },
    ]);
  };

  const updateElement = (index: number, patch: Partial<HardscapeElementRequest>) => {
    setElements(
      brief.elements.map((el, i) => (i === index ? { ...el, ...patch } : el)),
    );
  };

  const removeElement = (index: number) => {
    setElements(brief.elements.filter((_, i) => i !== index));
  };

  const setDecor = (patch: Partial<HardscapeBrief["decor"]>) =>
    onChange({ ...brief, decor: { ...brief.decor, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      {/* Element list */}
      <section
        className="rounded-card border border-border bg-surface p-5"
        data-tour="brief"
      >
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-copper" />
          <h2 className="text-sm font-medium text-foreground">
            Surfaces in this job
          </h2>
          <span className="ml-auto text-xs text-muted-2">
            {brief.elements.length}{" "}
            {brief.elements.length === 1 ? "element" : "elements"}
          </span>
        </div>

        {brief.elements.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border bg-ink-2 p-4 text-center text-xs text-muted-2">
            Add at least one surface below to generate a layout.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {brief.elements.map((el, index) => (
                <motion.li
                  key={`${el.kind}-${index}`}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: EASE }}
                >
                  <ElementRow
                    request={el}
                    onChange={(patch) => updateElement(index, patch)}
                    onRemove={() => removeElement(index)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        <div className="mt-4">
          <p className="text-xs text-muted-2">Add a surface</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ELEMENT_KINDS.map((k) => (
              <button
                key={k.kind}
                type="button"
                onClick={() => addElement(k.kind)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-copper hover:text-copper-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
              >
                <Plus className="size-3.5" />
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Decorative options */}
      <section className="rounded-card border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-copper" />
          <h2 className="text-sm font-medium text-foreground">
            Decorative detailing
          </h2>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <DecorToggle
            label="Banded border"
            description="A contrast ribbon framing the largest patio or pool deck."
            checked={brief.decor.bandedBorder}
            onChange={(on) => setDecor({ bandedBorder: on })}
          />
          <AnimatePresence initial={false}>
            {brief.decor.bandedBorder && (
              <motion.div
                initial={reduce ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                transition={{ duration: 0.26, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-border bg-ink-2 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-2">
                    Border material
                  </p>
                  <div className="mt-2">
                    <MaterialPicker
                      value={brief.decor.borderMaterial ?? "natural-stone"}
                      onChange={(m) => setDecor({ borderMaterial: m })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <DecorToggle
            label="Medallion inlay"
            description="A feature panel set at the centre of the largest patio."
            checked={brief.decor.medallionInlay}
            onChange={(on) => setDecor({ medallionInlay: on })}
          />
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Element row                                                                */
/* -------------------------------------------------------------------------- */

function ElementRow({
  request,
  onChange,
  onRemove,
}: {
  request: HardscapeElementRequest;
  onChange: (patch: Partial<HardscapeElementRequest>) => void;
  onRemove: () => void;
}) {
  const info = kindInfo(request.kind);
  const size = request.targetSqft ?? info.defaultSqft;

  return (
    <div className="rounded-lg border border-border bg-ink-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{info.label}</p>
          <p className="mt-0.5 text-xs text-muted-2">{info.description}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${info.label}`}
          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-2 transition-colors hover:bg-surface-2 hover:text-[#f0917c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-2">
          Material
        </p>
        <div className="mt-2">
          <MaterialPicker
            value={request.material}
            onChange={(m) => onChange({ material: m })}
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`size-${info.kind}-${size}`}
            className="text-[11px] uppercase tracking-wide text-muted-2"
          >
            Target size
          </label>
          <span className="font-display text-sm tracking-tight text-copper-bright">
            {size.toLocaleString()} ft²
          </span>
        </div>
        <input
          id={`size-${info.kind}-${size}`}
          type="range"
          min={info.minSqft}
          max={info.maxSqft}
          step={10}
          value={size}
          onChange={(e) => onChange({ targetSqft: Number(e.target.value) })}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-copper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40"
          aria-label={`${info.label} target size in square feet`}
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-2">
          <span>{info.minSqft} ft²</span>
          <span>{info.maxSqft} ft²</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Material picker                                                            */
/* -------------------------------------------------------------------------- */

function MaterialPicker({
  value,
  onChange,
}: {
  value: HardscapeMaterial;
  onChange: (m: HardscapeMaterial) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Surface material">
      {MATERIALS.map((m) => {
        const active = m.material === value;
        return (
          <button
            key={m.material}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.material)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40",
              active
                ? "border-copper bg-copper/15 text-copper-bright"
                : "border-border bg-surface text-muted hover:border-border-bright hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm border border-border-bright"
              style={{ backgroundColor: materialInfo(m.material).swatch }}
            />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Decor toggle                                                               */
/* -------------------------------------------------------------------------- */

function DecorToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-ink-2 p-3.5 transition-colors hover:border-border-bright">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-muted-2">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/40",
          checked
            ? "border-copper bg-copper/30"
            : "border-border bg-surface-3",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-[1.125rem] rounded-full transition-all",
            checked
              ? "left-[1.375rem] bg-copper"
              : "left-0.5 bg-muted-2",
          )}
        />
      </button>
    </label>
  );
}
