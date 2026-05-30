import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(
      1,
      parseInt(String(url.searchParams.get("page") ?? "1"), 10) || 1,
    );
    const limit = Math.min(
      parseInt(String(url.searchParams.get("limit") ?? "10"), 10) || 10,
      50,
    );
    const offset = (page - 1) * limit;

    const { user } = await requireRelative(request);

    const [rows, countRows] = await Promise.all([
      db<any>`
        SELECT p.id, p.amount, p.currency, p.status, p.paid_at, p.created_at,
               cs.care_type, eu.name AS elder_name
        FROM payments p
        JOIN care_sessions cs ON p.session_id = cs.id
        JOIN elders e ON cs.elder_id = e.id
        JOIN users eu ON e.user_id = eu.id
        WHERE p.payer_user_id = ${user.id}
        ORDER BY p.paid_at DESC NULLS LAST, p.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `,
      db<{ total: number }>`
        SELECT COUNT(*)::INT AS total FROM payments WHERE payer_user_id = ${user.id}
      `,
    ]);

    const total = countRows?.[0]?.total ?? 0;

    return Response.json({
      success: true,
      data: {
        payments: rows || [],
        pagination: {
          total,
          page,
          limit,
          hasMore: offset + (rows?.length ?? 0) < total,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/payments/history] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/payments/history+api.ts
  PURPOSE: GET /api/relative/payments/history
           Returns paginated payment history for the Sessions screen
           spending section and Profile analytics.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  page:  string (default '1')
  limit: string (default '10', max 50)

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE payments   alias: p
    id, session_id, payer_user_id, amount, currency, status, paid_at,
    created_at

  TABLE care_sessions   alias: cs
    id, care_type, elder_id

  TABLE elders          alias: e
    id, user_id

  TABLE users           alias: eu  (elder name)
    id, name

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse page + limit
    page   = Math.max(1, parseInt(pageParam ?? '1'))
    limit  = Math.min(parseInt(limitParam ?? '10'), 50)
    offset = (page - 1) * limit

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — Run both queries in parallel with Promise.all():

    QUERY A — Paginated payments
      SELECT
        p.id, p.amount, p.currency, p.status, p.paid_at, p.created_at,
        cs.care_type,
        eu.name AS elder_name
      FROM   payments p
      JOIN   care_sessions cs ON p.session_id = cs.id
      JOIN   elders        e  ON cs.elder_id  = e.id
      JOIN   users         eu ON e.user_id    = eu.id
      WHERE  p.payer_user_id = ${user.id}
      ORDER  BY p.paid_at DESC NULLS LAST, p.created_at DESC
      LIMIT  ${limit}
      OFFSET ${offset}

    QUERY B — Total count
      SELECT COUNT(*)::INT AS total
      FROM   payments
      WHERE  payer_user_id = ${user.id}

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        payments: Array,
        pagination: { total, page, limit, hasMore }
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Never expose stripe_payment_intent_id or stripe_customer_id in response
  - paid_at may be null for pending payments — handle gracefully
  - Both queries run in parallel via Promise.all()
*/
