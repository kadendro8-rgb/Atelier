/**
 * Image-generation provider registry + resolver.
 *
 * `getImageGenProvider()` is the single entry point the pipeline calls. It
 * returns the first configured provider in the registry, or the stub when none
 * is configured — so the flow never breaks and the keyless default Just Works.
 *
 * ─── Adding a real photoreal provider later ───────────────────────────────
 *  1. Create `lib/imagegen/provider.<name>.ts` exporting an `ImageGenProvider`
 *     (follow the contract on `ImageGenProvider` in `./types.ts`; use
 *     `provider.stub.ts` as the reference shape).
 *  2. Add ONE line to the `REGISTRY` array below, before `stubImageGenProvider`
 *     (order = priority; the stub must stay last as the always-available
 *     fallback).
 *  That's it — one new file + one registry line, zero changes to callers.
 */
import { stubImageGenProvider } from "./provider.stub";
import type {
  DesignIntent,
  ImageGenProvider,
  ImageGenResult,
} from "./types";

export type {
  DesignIntent,
  ImageGenInput,
  ImageGenProvider,
  ImageGenResult,
  ImageGenSuccess,
  ImageGenFailure,
  ImageGenNotConfigured,
  SourcePhoto,
} from "./types";

/**
 * Provider priority list. Real providers go ABOVE the stub; the stub stays
 * last so there is always an available fallback.
 *
 * Example, once a real provider exists:
 *   import { geminiImageGenProvider } from "./provider.gemini";
 *   const REGISTRY = [geminiImageGenProvider, stubImageGenProvider];
 */
const REGISTRY: readonly ImageGenProvider[] = [stubImageGenProvider];

/**
 * Resolve the active image-generation provider.
 *
 * Returns the first registered provider whose `isConfigured()` is true,
 * falling back to the stub. `isConfigured()` is contractually non-throwing, so
 * this resolver is safe to call from anywhere (client or server).
 */
export function getImageGenProvider(): ImageGenProvider {
  for (const provider of REGISTRY) {
    try {
      if (provider.isConfigured()) return provider;
    } catch {
      // A misbehaving provider must not break resolution — skip it.
    }
  }
  return stubImageGenProvider;
}

/**
 * Compose a single plain-language instruction from structured design intent.
 * Providers that take an unstructured prompt can use `intent.instruction`
 * (populated by this helper) directly.
 */
export function buildInstruction(intent: DesignIntent): string {
  const parts: string[] = [];
  const subject = intent.style
    ? intent.style.replace(/-/g, " ")
    : intent.projectType === "hardscape"
      ? "hardscape design"
      : "home design";
  parts.push(`Render a photoreal ${subject} onto this real site photo`);
  if (intent.features && intent.features.length > 0) {
    parts.push(`featuring ${intent.features.join(", ")}`);
  }
  if (intent.brief && intent.brief.trim()) {
    parts.push(`Brief: ${intent.brief.trim()}`);
  }
  parts.push(
    "Preserve the existing perspective, lighting, and surroundings.",
  );
  return parts.join(". ").replace(/\.\./g, ".");
}

/**
 * Convenience: resolve the provider and run a generation in one call. Always
 * resolves to an `ImageGenResult` — the provider contract forbids throwing,
 * and any stray rejection is caught here and surfaced as a `failed` result.
 */
export async function generateSitePreview(input: {
  photo: import("./types").SourcePhoto;
  intent: DesignIntent;
  signal?: AbortSignal;
}): Promise<ImageGenResult> {
  const provider = getImageGenProvider();
  const intent: DesignIntent = {
    ...input.intent,
    instruction:
      input.intent.instruction ?? buildInstruction(input.intent),
  };
  try {
    return await provider.generate({
      photo: input.photo,
      intent,
      signal: input.signal,
    });
  } catch (err) {
    // Defensive: the contract says providers never throw, but a future
    // provider bug must not crash the pipeline.
    return {
      status: "failed",
      provider: provider.id,
      message:
        err instanceof Error
          ? `Render failed: ${err.message}`
          : "Render failed unexpectedly.",
    };
  }
}
