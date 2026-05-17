/**
 * Image-generation provider seam — shared types.
 *
 * This module describes the contract for the *photoreal image-generation* step
 * of Atelier's pipeline: a contractor snaps a photo of a site, and a provider
 * brings the design vision to life on that real photo.
 *
 * The actual provider (Gemini / FLUX / OpenAI image / etc.) is intentionally
 * deferred — no provider is chosen yet. These types are the stable seam a real
 * provider drops into later as a single file (see `provider.stub.ts` for the
 * reference shape and `index.ts` for the registry).
 *
 * House style: this mirrors `lib/db`'s keyless-graceful pattern — instead of
 * throwing when nothing is configured, `generate()` resolves to a typed
 * `not-configured` outcome so the pipeline runs end-to-end today.
 */

/** A source photo handed to a provider. Always client-supplied, keyless. */
export interface SourcePhoto {
  /**
   * The image as a data URL (`data:image/jpeg;base64,...`). A data URL keeps
   * the seam transport-agnostic: no upload server, no object storage, no env.
   */
  dataUrl: string;
  /** MIME type, e.g. `image/jpeg` or `image/png`. */
  mimeType: string;
  /** Pixel dimensions, when known — lets a provider pick a matching aspect. */
  width?: number;
  height?: number;
}

/**
 * Structured design intent passed alongside the source photo. A provider turns
 * this into its own prompt; keeping it structured (rather than a raw string)
 * means every provider gets the same well-formed input.
 */
export interface DesignIntent {
  /** Architectural / hardscape style id, e.g. `"modern-farmhouse"`. */
  style?: string;
  /** Project type, e.g. `"home"` or `"hardscape"`. */
  projectType?: string;
  /** Free-text brief or design notes from the builder. */
  brief?: string;
  /** Notable features to honor, e.g. `["Covered porch", "Paver walkway"]`. */
  features?: string[];
  /**
   * A single plain-language instruction describing the transformation, e.g.
   * "Render a modern farmhouse on this lot with a wraparound porch." Providers
   * that take an unstructured prompt can use this directly.
   */
  instruction?: string;
}

/** The full input to a single `generate()` call. */
export interface ImageGenInput {
  /** The real site photo to transform. */
  photo: SourcePhoto;
  /** What the design should become. */
  intent: DesignIntent;
  /**
   * Optional abort signal. A well-behaved provider should pass this through to
   * its underlying `fetch` so a navigated-away render is cancelled.
   */
  signal?: AbortSignal;
}

/** A successfully generated photoreal image. */
export interface ImageGenSuccess {
  status: "ok";
  /** Identifier of the provider that produced this result. */
  provider: string;
  /** The generated image as a data URL or a fully-qualified https URL. */
  imageUrl: string;
  /** Optional human-readable note (e.g. model id, seed). */
  note?: string;
}

/**
 * The provider ran but cannot produce a real image. This is the *expected*
 * outcome today: the default stub returns it so the pipeline shows a tasteful
 * placeholder instead of erroring. Not an error — a graceful degradation.
 */
export interface ImageGenNotConfigured {
  status: "not-configured";
  provider: string;
  /** User-facing explanation, safe to render directly. */
  message: string;
}

/** The provider was configured and tried, but failed (network, quota, etc.). */
export interface ImageGenFailure {
  status: "failed";
  provider: string;
  /** User-facing explanation, safe to render directly. */
  message: string;
}

/** The discriminated result of a `generate()` call. Never throws for these. */
export type ImageGenResult =
  | ImageGenSuccess
  | ImageGenNotConfigured
  | ImageGenFailure;

/**
 * The provider contract.
 *
 * To add a real photoreal provider later, create ONE new file
 * (`lib/imagegen/provider.<name>.ts`) that exports an object implementing this
 * interface, then add one line to the registry in `lib/imagegen/index.ts`.
 *
 * A real implementation MUST:
 *  1. Set a stable, unique `id`.
 *  2. Implement `isConfigured()` to check for its credentials WITHOUT throwing
 *     (e.g. `return Boolean(process.env.MY_IMAGEGEN_KEY)`). Atelier is keyless
 *     by default, so a missing key is normal — never assume it exists.
 *  3. Implement `generate(input)` so that it ALWAYS resolves to an
 *     `ImageGenResult` and NEVER throws or rejects:
 *       - return `{ status: "not-configured", ... }` when `isConfigured()` is
 *         false (callers rely on this to show the placeholder);
 *       - return `{ status: "ok", imageUrl, ... }` on success;
 *       - return `{ status: "failed", message, ... }` on any caught error
 *         (network, quota, malformed response, abort) — wrap the whole call
 *         body in try/catch.
 *  4. Honor `input.signal` by passing it to `fetch` so renders are cancellable.
 *  5. Keep `message` strings user-facing and free of secrets / stack traces.
 *
 * Keep provider files self-contained: only `lib/imagegen/types.ts` should be
 * imported here, so a provider is genuinely "one file + one registry line".
 */
export interface ImageGenProvider {
  /** Stable, unique identifier, e.g. `"stub"`, `"gemini"`, `"flux"`. */
  readonly id: string;
  /** Whether this provider has the credentials/config it needs. */
  isConfigured(): boolean;
  /** Transform a source photo per the design intent. Never throws. */
  generate(input: ImageGenInput): Promise<ImageGenResult>;
}
