import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/builder/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const brief = { sqft: 2800, beds: 4, baths: 3, style: "modern farmhouse" };

beforeEach(() => {
  // No Supabase — DB-backed publishes degrade rather than throw.
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  vi.stubEnv("SUPABASE_SECRET_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("builder/publish — request validation", () => {
  it("rejects a malformed JSON body", async () => {
    expect((await POST(request("{ broken"))).status).toBe(400);
  });

  it("rejects a missing projectId or brief", async () => {
    expect((await POST(request({ brief }))).status).toBe(400);
    expect((await POST(request({ projectId: "p1" }))).status).toBe(400);
  });

  it("rejects a blank projectId or a non-object brief", async () => {
    expect((await POST(request({ projectId: "  ", brief }))).status).toBe(400);
    expect(
      (await POST(request({ projectId: "p1", brief: "nope" }))).status,
    ).toBe(400);
  });
});

describe("builder/publish — degradation", () => {
  it("reports not-published for a local (keyless) project id", async () => {
    const res = await POST(request({ projectId: "local-abc123", brief }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ published: false, reason: "local" });
  });

  it("degrades to not-published when Supabase is unavailable", async () => {
    const res = await POST(request({ projectId: "real-project-1", brief }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.published).toBe(false);
    expect(json.reason).toBe("unavailable");
  });
});
