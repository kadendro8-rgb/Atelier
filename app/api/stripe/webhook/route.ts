/**
 * Stripe webhook receiver.
 *
 * Verifies the event signature with `STRIPE_WEBHOOK_SECRET`, then acts on it:
 * on `checkout.session.completed` the funded project is marked `'funded'` and
 * a `'deposit'` GMV event is recorded.
 *
 * Graceful behaviour:
 *  - Stripe / webhook-secret unconfigured, missing signature, or a failed
 *    signature verification → `400` (never an unhandled 500 on missing config).
 *  - Unknown event types → `200` acknowledgement so Stripe stops retrying.
 *
 * The raw request body (`req.text()`) is required for signature verification —
 * `req.json()` would re-serialise and break the HMAC.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { updateProject, logGmvEvent, DbUnavailableError } from "@/lib/db";

export const runtime = "nodejs";

/** Handle a completed checkout: fund the project + log the GMV deposit. */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const projectId =
    session.client_reference_id ?? session.metadata?.project_id ?? null;
  if (!projectId) {
    console.warn("stripe/webhook: checkout session missing project id.");
    return;
  }

  const amountCents = session.amount_total;
  if (typeof amountCents !== "number" || amountCents <= 0) {
    console.warn("stripe/webhook: checkout session missing amount_total.");
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  try {
    await updateProject(projectId, { status: "funded" });
    await logGmvEvent({
      project_id: projectId,
      amount_cents: amountCents,
      type: "deposit",
      stripe_payment_intent_id: paymentIntentId,
    });
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      // Storage not configured — log and ack; nothing to persist.
      console.warn("stripe/webhook: storage unavailable, skipping persist.");
      return;
    }
    throw err;
  }
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    // Not configured to receive webhooks — reject without a 500.
    return NextResponse.json(
      { error: "Webhooks are not configured." },
      { status: 400 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  // Raw body — required for HMAC signature verification.
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    console.warn("stripe/webhook: signature verification failed:", detail);
    return NextResponse.json(
      { error: "Signature verification failed." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object satisfies Stripe.Checkout.Session,
        );
        break;
      default:
        // Unknown / unhandled event — acknowledge so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("stripe/webhook: handler failed:", err);
    // Surface a 500 only for genuine processing failures so Stripe retries.
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
