import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(body: unknown): Request {
  return new Request("http://localhost/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkout — configuration guard", () => {
  it("responds 503 when Stripe is not configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const res = await POST(request({ slug: "a", token: "b" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/not configured/i);
  });
});

describe("checkout — request validation", () => {
  it("rejects a malformed JSON body", async () => {
    const res = await POST(request("{ not json"));
    expect(res.status).toBe(400);
  });

  it("rejects a missing slug or token", async () => {
    expect((await POST(request({ token: "b" }))).status).toBe(400);
    expect((await POST(request({ slug: "a" }))).status).toBe(400);
  });

  it("rejects a blank slug or token", async () => {
    expect((await POST(request({ slug: "  ", token: "b" }))).status).toBe(400);
    expect((await POST(request({ slug: "a", token: "" }))).status).toBe(400);
  });
});
