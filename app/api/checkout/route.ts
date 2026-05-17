/**
 * Deposit checkout route.
 *
 * `POST { slug, token }` → `{ url }`, a Stripe Checkout Session for the
 * project's design deposit. The portal redirects the browser to that URL.
 *
 * The deposit amount is resolved from the real `projects` row when Supabase is
 * configured and the `slug` + `share_token` match a project; otherwise it
 * falls back to the portal's priced demo amount so the flow still runs without
 * a database. When the matched project is real, its id rides on the session
 * `metadata` so the webhook can mark that exact project funded.
 *
 * Keyless-safe: with no `STRIPE_SECRET_KEY` the route responds 503 and the
 * portal keeps its non-charging demo flow.
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getProjectByShareToken, DbUnavailableError } from "@/lib/db";
import { buildPortalProject } from "@/lib/portal-mock";

export const runtime = "nodejs";

interface CheckoutBody {
  slug?: unknown;
  token?: unknown;
}

/** A resolved deposit: amount in cents, a label, and the real project id. */
type Deposit = {
  amountCents: number;
  projectName: string;
  projectId: string | null;
};

/**
 * Resolve the deposit for a portal link. Prefers the real project row; falls
 * back to the deterministic demo project when the DB is unavailable or the
 * link matches no project.
 */
async function resolveDeposit(slug: string, token: string): Promise<Deposit> {
  try {
    const project = await getProjectByShareToken(slug, token);
    if (project && project.deposit_cents && project.deposit_cents > 0) {
      return {
        amountCents: project.deposit_cents,
        projectName: project.name,
        projectId: project.id,
      };
    }
  } catch (err) {
    if (!(err instanceof DbUnavailableError)) {
      console.error("checkout: project lookup failed:", err);
    }
    // Fall through to the demo amount.
  }

  const demo = buildPortalProject(slug, token);
  return {
    amountCents: Math.round(demo.deposit * 100),
    projectName: demo.projectName,
    projectId: null,
  };
}

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) {
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

  const { slug, token } = body;
  if (
    typeof slug !== "string" ||
    slug.trim().length === 0 ||
    typeof token !== "string" ||
    token.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Expected { slug: string, token: string }." },
      { status: 400 },
    );
  }

  const deposit = await resolveDeposit(slug, token);
  const origin = new URL(req.url).origin;
  const portalUrl = `${origin}/p/${encodeURIComponent(slug)}/${encodeURIComponent(token)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: deposit.amountCents,
            product_data: { name: `${deposit.projectName} — design deposit` },
          },
        },
      ],
      success_url: `${portalUrl}?funded=1`,
      cancel_url: portalUrl,
      metadata: {
        slug,
        token,
        ...(deposit.projectId ? { projectId: deposit.projectId } : {}),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout: Stripe session creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout." },
      { status: 502 },
    );
  }
}
