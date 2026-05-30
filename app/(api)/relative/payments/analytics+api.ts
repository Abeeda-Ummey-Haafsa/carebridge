import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const [weekly, monthly] = await Promise.all([
      db<any>`
        SELECT
          TO_CHAR(DATE_TRUNC('week', d.week), 'YYYY-WW') AS week_label,
          d.week::DATE AS week_start,
          COALESCE(SUM(p.amount), 0)::FLOAT AS total_spent,
          COUNT(p.id)::INT AS payment_count
        FROM generate_series(
          DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 weeks',
          DATE_TRUNC('week', CURRENT_DATE),
          '1 week'::INTERVAL
        ) AS d(week)
        LEFT JOIN payments p
          ON p.payer_user_id = ${user.id}
         AND p.status = 'succeeded'
         AND DATE_TRUNC('week', p.paid_at) = d.week
        GROUP BY d.week
        ORDER BY d.week ASC
      `,
      db<any>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month_label,
          COALESCE(SUM(p.amount), 0)::FLOAT AS total_spent,
          COUNT(p.id)::INT AS payment_count
        FROM generate_series(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::INTERVAL
        ) AS d(month)
        LEFT JOIN payments p
          ON p.payer_user_id = ${user.id}
         AND p.status = 'succeeded'
         AND DATE_TRUNC('month', p.paid_at) = d.month
        GROUP BY d.month
        ORDER BY d.month ASC
      `,
    ]);

    return Response.json({
      success: true,
      data: { weekly: weekly || [], monthly: monthly || [] },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/payments/analytics] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/payments/analytics+api.ts
  PURPOSE: GET /api/relative/payments/analytics
           Returns weekly (last 8 weeks) and monthly (last 6 months)
           spending breakdowns. Powers react-native-gifted-charts bar
           charts in the Sessions screen and Profile analytics.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — Run both queries in parallel with Promise.all():

    QUERY A — Weekly breakdown (last 8 weeks, generate_series)
      SELECT
        TO_CHAR(DATE_TRUNC('week', d.week), 'YYYY-WW') AS week_label,
        d.week::DATE                                    AS week_start,
        COALESCE(SUM(p.amount), 0)::FLOAT              AS total_spent,
        COUNT(p.id)::INT                               AS payment_count
      FROM generate_series(
             DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 weeks',
             DATE_TRUNC('week', CURRENT_DATE),
             '1 week'::INTERVAL
           ) AS d(week)
      LEFT JOIN payments p
             ON p.payer_user_id = ${user.id}
            AND p.status        = 'succeeded'
            AND DATE_TRUNC('week', p.paid_at) = d.week
      GROUP BY d.week
      ORDER BY d.week ASC

    QUERY B — Monthly breakdown (last 6 months, generate_series)
      SELECT
        TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month_label,
        COALESCE(SUM(p.amount), 0)::FLOAT               AS total_spent,
        COUNT(p.id)::INT                                AS payment_count
      FROM generate_series(
             DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
             DATE_TRUNC('month', CURRENT_DATE),
             '1 month'::INTERVAL
           ) AS d(month)
      LEFT JOIN payments p
             ON p.payer_user_id = ${user.id}
            AND p.status        = 'succeeded'
            AND DATE_TRUNC('month', p.paid_at) = d.month
      GROUP BY d.month
      ORDER BY d.month ASC

  STEP 3 — Return 200:
    {
      success: true,
      data: {
        weekly:  Array,
        monthly: Array,
      }
    }
    weekly always returns exactly 8 items (oldest → newest).
    monthly always returns exactly 6 items.

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Use LEFT JOIN + generate_series — zero-spend periods must appear
  - Run both queries in parallel with Promise.all()
  - Only include payments with status = 'succeeded'
  - week_label format 'YYYY-WW' and month_label 'YYYY-MM' are for x-axis
    labels in react-native-gifted-charts
*/
