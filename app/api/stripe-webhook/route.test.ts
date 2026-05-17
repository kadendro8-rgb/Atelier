import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { POST } from "./route";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const WEBHOOK_SECRET = "whsec_test_secret";
const stripe = new Stripe("sk_test_dummy");

/** Build a webhook Request with a correctly signed body. */
function signedRequest(event: object, secret = WEBHOOK_SECRET): Request {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  return new Request("http://localhost/api/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": signature },
    body: payload,
  });
}

const completedEvent = (metadata: Record<string, string> = {}) => ({
  id: "evt_test",
  type: "checkout.session.completed",
  data: { object: { id: "cs_test", metadata } },
});

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_dummy");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WEBHOOK_SECRET);
  // No Supabase — markProjectFunded degrades to DbUnavailableError.
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/* -------------------------------------------------------------------------- */
/* Configuration guard                                                        */
/* -------------------------------------------------------------------------- */

describe("stripe-webhook — configuration", () => {
  it("responds 503 when Stripe is not configured", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    const res = await POST(signedRequest(completedEvent()));
    expect(res.status).toBe(503);
  });
});

/* -------------------------------------------------------------------------- */
/* Signature verification                                                     */
/* -------------------------------------------------------------------------- */

describe("stripe-webhook — signature verification", () => {
  it("rejects a request with no stripe-signature header", async () => {
    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        body: JSON.stringify(completedEvent()),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects a body signed with the wrong secret", async () => {
    const res = await POST(
      signedRequest(completedEvent(), "whsec_attacker_secret"),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/signature/i);
  });

  it("rejects a tampered body whose signature no longer matches", async () => {
    const payload = JSON.stringify(completedEvent({ projectId: "proj-1" }));
    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: WEBHOOK_SECRET,
    });
    const tampered = payload.replace("proj-1", "proj-evil");
    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: tampered,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts a correctly signed event", async () => {
    const res = await POST(signedRequest(completedEvent()));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* Event handling                                                             */
/* -------------------------------------------------------------------------- */

describe("stripe-webhook — event handling", () => {
  it("acknowledges a completed session with no real projectId", async () => {
    const res = await POST(signedRequest(completedEvent()));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true });
  });

  it("degrades gracefully when a real project cannot be persisted", async () => {
    // projectId is present but Supabase is unconfigured — the webhook must
    // still 200 so Stripe does not retry a permanently-failing delivery.
    const res = await POST(
      signedRequest(completedEvent({ projectId: "proj-1" })),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, persisted: false });
  });

  it("ignores event types other than checkout.session.completed", async () => {
    const res = await POST(
      signedRequest({
        id: "evt_other",
        type: "payment_intent.created",
        data: { object: {} },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });
});
