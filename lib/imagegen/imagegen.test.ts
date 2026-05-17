import { describe, expect, it } from "vitest";
import {
  buildInstruction,
  generateSitePreview,
  getImageGenProvider,
} from "./index";
import { stubImageGenProvider } from "./provider.stub";
import type { ImageGenInput, SourcePhoto } from "./types";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const samplePhoto: SourcePhoto = {
  dataUrl: "data:image/jpeg;base64,/9j/AAAA",
  mimeType: "image/jpeg",
  width: 1280,
  height: 960,
};

const sampleInput = (signal?: AbortSignal): ImageGenInput => ({
  photo: samplePhoto,
  intent: {
    style: "modern-farmhouse",
    projectType: "home",
    brief: "Wraparound porch, board-and-batten siding.",
    features: ["Covered porch"],
  },
  signal,
});

/* -------------------------------------------------------------------------- */
/* Resolver                                                                   */
/* -------------------------------------------------------------------------- */

describe("getImageGenProvider", () => {
  it("returns the stub when no real provider is configured", () => {
    expect(getImageGenProvider()).toBe(stubImageGenProvider);
  });

  it("returns a provider whose contract methods exist", () => {
    const provider = getImageGenProvider();
    expect(typeof provider.id).toBe("string");
    expect(typeof provider.isConfigured).toBe("function");
    expect(typeof provider.generate).toBe("function");
  });
});

/* -------------------------------------------------------------------------- */
/* Stub provider                                                              */
/* -------------------------------------------------------------------------- */

describe("stubImageGenProvider", () => {
  it("is never reported as configured", () => {
    expect(stubImageGenProvider.isConfigured()).toBe(false);
  });

  it("resolves to a not-configured result instead of throwing", async () => {
    const result = await stubImageGenProvider.generate(sampleInput());
    expect(result.status).toBe("not-configured");
    expect(result.provider).toBe("stub");
    if (result.status === "not-configured") {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("never claims to produce a real image", async () => {
    const result = await stubImageGenProvider.generate(sampleInput());
    expect(result.status).not.toBe("ok");
  });

  it("honors an already-aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await stubImageGenProvider.generate(
      sampleInput(controller.signal),
    );
    expect(result.status).toBe("failed");
  });
});

/* -------------------------------------------------------------------------- */
/* buildInstruction                                                           */
/* -------------------------------------------------------------------------- */

describe("buildInstruction", () => {
  it("humanizes a hyphenated style id", () => {
    const text = buildInstruction({ style: "modern-farmhouse" });
    expect(text).toContain("modern farmhouse");
    expect(text).not.toContain("modern-farmhouse");
  });

  it("includes named features", () => {
    const text = buildInstruction({
      style: "lake-home",
      features: ["Screened porch", "Walkout lower level"],
    });
    expect(text).toContain("Screened porch");
    expect(text).toContain("Walkout lower level");
  });

  it("falls back to a project-type subject when no style is given", () => {
    expect(buildInstruction({ projectType: "hardscape" })).toContain(
      "hardscape design",
    );
    expect(buildInstruction({ projectType: "home" })).toContain(
      "home design",
    );
  });

  it("always asks to preserve the real photo's perspective", () => {
    expect(buildInstruction({})).toContain("perspective");
  });
});

/* -------------------------------------------------------------------------- */
/* generateSitePreview                                                        */
/* -------------------------------------------------------------------------- */

describe("generateSitePreview", () => {
  it("runs the full seam and resolves to a graceful result", async () => {
    const result = await generateSitePreview({
      photo: samplePhoto,
      intent: { style: "modern-farmhouse", projectType: "home" },
    });
    // With only the stub registered, the pipeline degrades gracefully.
    expect(["not-configured", "failed"]).toContain(result.status);
  });

  it("never throws, even with a minimal intent", async () => {
    await expect(
      generateSitePreview({ photo: samplePhoto, intent: {} }),
    ).resolves.toBeDefined();
  });
});
