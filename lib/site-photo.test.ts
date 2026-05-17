import { describe, expect, it } from "vitest";
import {
  deleteSitePhoto,
  loadSitePhoto,
  rekeySitePhoto,
  saveSitePhoto,
  type SitePhoto,
} from "./site-photo";

/**
 * These tests run in the Node (no-DOM, no-IndexedDB) environment, which is
 * exactly the "storage unavailable" path. They assert the contract that every
 * `lib/site-photo` operation degrades gracefully — resolving without throwing —
 * so the capture flow never breaks when IndexedDB is absent.
 */

const samplePhoto: SitePhoto = {
  projectId: "draft-test",
  dataUrl: "data:image/jpeg;base64,/9j/AAAA",
  mimeType: "image/jpeg",
  width: 1280,
  height: 960,
  source: "camera",
  capturedAt: new Date("2026-05-17T00:00:00.000Z").toISOString(),
};

describe("site-photo storage — graceful degradation without IndexedDB", () => {
  it("saveSitePhoto resolves false instead of throwing", async () => {
    await expect(saveSitePhoto(samplePhoto)).resolves.toBe(false);
  });

  it("loadSitePhoto resolves null instead of throwing", async () => {
    await expect(loadSitePhoto("draft-test")).resolves.toBeNull();
  });

  it("deleteSitePhoto resolves without throwing", async () => {
    await expect(deleteSitePhoto("draft-test")).resolves.toBeUndefined();
  });

  it("rekeySitePhoto resolves without throwing", async () => {
    await expect(
      rekeySitePhoto("draft-test", "project-1"),
    ).resolves.toBeUndefined();
  });

  it("rekeySitePhoto is a no-op when ids match", async () => {
    await expect(
      rekeySitePhoto("same-id", "same-id"),
    ).resolves.toBeUndefined();
  });
});
