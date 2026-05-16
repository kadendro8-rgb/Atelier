import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Stripe Connect webhook.
 *
 * TODO(v2-section-4): verify the Stripe signature, handle
 * `checkout.session.completed`, mark the project `funded`, email the
 * builder and client, and log the GMV event. See docs/v2-spec.md §4.2.
 */
export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { error: "stripe-webhook not implemented (v2 Section 4)" },
    { status: 501 },
  );
}
