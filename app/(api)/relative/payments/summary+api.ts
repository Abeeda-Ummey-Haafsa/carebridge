import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);

    const [thisMonthRows, lastMonthRows, avgRows] = await Promise.all([
      db<{ total_this_month: number }>`
        SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_this_month
        FROM payments
        WHERE payer_user_id = ${user.id}
          AND status = 'succeeded'
          AND paid_at >= DATE_TRUNC('month', CURRENT_DATE)
      `,
      db<{ total_last_month: number }>`
        SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_last_month
        FROM payments
        WHERE payer_user_id = ${user.id}
          AND status = 'succeeded'
          AND paid_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
          AND paid_at < DATE_TRUNC('month', CURRENT_DATE)
      `,
      db<{ avg_session_cost: number; completed_payment_count: number }>`
        SELECT COALESCE(AVG(amount),0)::FLOAT AS avg_session_cost, COUNT(*)::INT AS completed_payment_count
        FROM payments
        WHERE payer_user_id = ${user.id}
          AND status = 'succeeded'
      `,
    ]);

    const thisMonth = thisMonthRows?.[0]?.total_this_month ?? 0;
    const lastMonth = lastMonthRows?.[0]?.total_last_month ?? 0;
    const activeCosts =
      elderIds && elderIds.length > 0
        ? ((
            await db<{ active_costs: number }>`
          SELECT COALESCE(SUM(total_cost), 0)::FLOAT AS active_costs
          FROM care_sessions
          WHERE elder_id = ANY(${elderIds}::int[])
            AND status IN ('pending','accepted')
        `
          )?.[0]?.active_costs ?? 0)
        : 0;
    const avgSessionCost = avgRows?.[0]?.avg_session_cost ?? 0;
    const completedPaymentCount = avgRows?.[0]?.completed_payment_count ?? 0;

    const trendPercent =
      lastMonth > 0
        ? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1))
        : null;

    return Response.json({
      success: true,
      data: {
        totalSpentThisMonth: thisMonth,
        totalSpentLastMonth: lastMonth,
        trendPercent,
        activeBookingCosts: activeCosts,
        averageSessionCost: avgSessionCost,
        completedPaymentCount,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/payments/summary] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/payments/summary+api.ts
  PURPOSE: GET /api/relative/payments/summary
           Returns spending summary widgets for the Sessions screen
           (Section 8) — total spent this month, active booking costs,
           completed payments, average session cost, and trend vs
           last month.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE payments
    id, session_id, payer_user_id, amount, status, paid_at

  TABLE care_sessions
    id, elder_id, status, total_cost, scheduled_at

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — const elderIds = await getRelativeElderIds(user.id)

  STEP 3 — Run in parallel with Promise.all():

    QUERY A — This month's total spend (from payments)
      SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_this_month
      FROM   payments
      WHERE  payer_user_id = ${user.id}
        AND  status        = 'succeeded'
        AND  paid_at      >= DATE_TRUNC('month', CURRENT_DATE)

    QUERY B — Last month's total spend (for trend)
      SELECT COALESCE(SUM(amount), 0)::FLOAT AS total_last_month
      FROM   payments
      WHERE  payer_user_id = ${user.id}
        AND  status        = 'succeeded'
        AND  paid_at      >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND  paid_at      <  DATE_TRUNC('month', CURRENT_DATE)

    QUERY C — Active booking costs (pending sessions)
      SELECT COALESCE(SUM(total_cost), 0)::FLOAT AS active_costs
      FROM   care_sessions
      WHERE  elder_id = ANY(${elderIds}::int[])
        AND  status   IN ('pending', 'accepted')

    QUERY D — Average and total completed session payments
      SELECT
        COALESCE(AVG(amount), 0)::FLOAT  AS avg_session_cost,
        COUNT(*)::INT                    AS completed_payment_count
      FROM   payments
      WHERE  payer_user_id = ${user.id}
        AND  status        = 'succeeded'

  STEP 4 — Compute trend
    const trendPct =
      lastMonth > 0
        ? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1))
        : null   // null = not enough data

  STEP 5 — Return 200:
    {
      success: true,
      data: {
        totalSpentThisMonth:         number,
        totalSpentLastMonth:         number,
        trendPercent:                number | null,
        activeBookingCosts:          number,
        averageSessionCost:          number,
        completedPaymentCount:       number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - All 4 queries run in parallel with Promise.all()
  - trendPercent is null when lastMonth = 0 (avoids division by zero)
  - activeBookingCosts uses care_sessions.total_cost (estimated),
    not payments table (no payment created yet for pending sessions)
  - COALESCE all SUM to 0 — empty result set returns null from SUM
*/
