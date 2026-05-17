/**
 * Stripe webhook.
 *
 * Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`, then
 * handles `checkout.session.completed` by marking the paid project `funded`.
 * Signature verification is mandatory — an unsigned or mis-signed body is
 * rejected with 400 so a forged request can never fund a project.
 *
 * The raw request body is required for verification, so this route reads
 * `req.text()` rather than `req.json()`.
 *
 * Keyless-safe: with no Stripe secret configured the route responds 503.
 * Events whose session carries no real `projectId` (the portal's demo flow)
 * are acknowledged without a database write.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { markProjectFunded, DbUnavailableError } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Signature verification failed: ${detail}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const projectId = session.metadata?.projectId;

    if (projectId) {
      try {
        await markProjectFunded(projectId);
      } catch (err) {
        if (err instanceof DbUnavailableError) {
          // Supabase not configured — acknowledge so Stripe does not retry.
          return NextResponse.json({ received: true, persisted: false });
        }
        console.error("stripe-webhook: markProjectFunded failed:", err);
        // Return 500 so Stripe retries a transient database failure.
        return NextResponse.json(
          { error: "Could not record the payment." },
          { status: 500 },
        );
      }
      return NextResponse.json({ received: true, persisted: true });
    }
  }

  return NextResponse.json({ received: true });
}
