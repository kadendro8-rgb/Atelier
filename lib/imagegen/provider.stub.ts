/**
 * Default no-op image-generation provider.
 *
 * Atelier ships keyless: with no provider configured, the photo pipeline still
 * runs end-to-end. This stub is the seam's honest default — it never pretends
 * to produce a photoreal result. It always resolves to a `not-configured`
 * outcome, which the render surface turns into a tasteful placeholder.
 *
 * This file is also the reference shape for a real provider: copy its
 * structure, keep it self-contained (only `./types`), and follow the contract
 * documented on `ImageGenProvider` in `./types.ts`.
 */
import type {
  ImageGenInput,
  ImageGenProvider,
  ImageGenResult,
} from "./types";

/**
 * Build the user-facing message for the not-configured outcome. Kept as a
 * function so the (already validated) input could shape the copy later.
 */
function notConfiguredMessage(): string {
  return (
    "Photoreal rendering isn't connected yet — your site photo is saved and " +
    "ready. When an image-generation provider is added, the design will be " +
    "rendered directly onto this photo."
  );
}

export const stubImageGenProvider: ImageGenProvider = {
  id: "stub",

  /** The stub is intentionally never "configured" — it has nothing to call. */
  isConfigured(): boolean {
    return false;
  },

  /**
   * Resolves to a `not-configured` result. Async to match the interface (a
   * real provider awaits a network call); the brief tick keeps callers honest
   * about the async seam.
   */
  async generate(input: ImageGenInput): Promise<ImageGenResult> {
    // Cooperative cancellation, even though there's no real work to do.
    if (input.signal?.aborted) {
      return {
        status: "failed",
        provider: "stub",
        message: "Render cancelled.",
      };
    }
    await Promise.resolve();
    return {
      status: "not-configured",
      provider: "stub",
      message: notConfiguredMessage(),
    };
  },
};
