/**
 * Stripe Checkout route — funds a project's deposit.
 *
 * `POST { projectId }` loads the project via W1's typed `getProject`, creates
 * a Stripe Checkout Session for its `deposit_cents`, and returns `{ url }` for
 * the client to redirect to.
 *
 * Graceful degradation (per `app/api/gis/project/route.ts`): when Stripe is
 * unconfigured, Supabase is unavailable, or the project / deposit is missing,
 * the route responds with a clean error status — never an unhandled 500.
 *
 * CORE scope: a plain platform Checkout Session. Stripe Connect split payouts
 * and the 0.5% application fee are deferred — see the TODO(v2) below.
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProject, DbUnavailableError } from "@/lib/db";

export const runtime = "nodejs";

interface CheckoutBody {
  projectId?: unknown;
}

/** Resolve the request origin (Vercel + local), for success/cancel URLs. */
function resolveOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("host");
  if (host) {
    const proto = host.startsWith("localhost") ? "http" : "https";
    return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
    // Stripe not configured — degrade gracefully, never 500.
    return NextResponse.json(
      { error: "Payments are not configured." },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const projectId =
    typeof body.projectId === "string" && body.projectId.trim().length > 0
      ? body.projectId.trim()
      : null;
  if (!projectId) {
    return NextResponse.json(
      { error: "A projectId is required." },
      { status: 400 },
    );
  }

  let project;
  try {
    project = await getProject(projectId);
  } catch (err) {
    if (err instanceof DbUnavailableError) {
      return NextResponse.json(
        { error: "Project storage is not configured." },
        { status: 503 },
      );
    }
    console.error("stripe/checkout: getProject failed:", err);
    return NextResponse.json(
      { error: "Could not load the project." },
      { status: 503 },
    );
  }

  if (!project) {
    return NextResponse.json(
      { error: "Project not found." },
      { status: 404 },
    );
  }

  const depositCents = project.deposit_cents;
  if (typeof depositCents !== "number" || depositCents <= 0) {
    return NextResponse.json(
      { error: "This project has no deposit to collect." },
      { status: 400 },
    );
  }

  const origin = resolveOrigin(req);
  const projectUrl = `${origin}/projects/${project.slug}`;

  try {
    // TODO(v2): use Stripe Connect — `payment_intent_data.transfer_data` to
    // route the deposit to the builder's connected account and take a 0.5%
    // `application_fee_amount`. CORE ships a plain platform Checkout Session.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: depositCents,
            product_data: {
              name: `Deposit — ${project.name}`,
            },
          },
        },
      ],
      success_url: `${projectUrl}?payment=success`,
      cancel_url: `${projectUrl}?payment=cancelled`,
      client_reference_id: project.id,
      metadata: { project_id: project.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout." },
        { status: 503 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("stripe/checkout: session creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 503 },
    );
  }
}
