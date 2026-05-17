import { describe, expect, it } from "vitest";
import { POST } from "./route";

// The Stripe Connect webhook is a declared-but-unimplemented v2 Section 4
// route. This test pins the stub contract: when signature verification and
// `checkout.session.completed` handling land, the 501 assertion fails and a
// real webhook test must replace it.
describe("stripe-webhook POST — unimplemented stub", () => {
  it("responds 501 Not Implemented", async () => {
    const res = await POST(
      new Request("http://localhost/api/stripe-webhook", { method: "POST" }),
    );
    expect(res.status).toBe(501);
    const body = await res.json();
    expect(body.error).toMatch(/not implemented/i);
  });
});
