/*
  FILE: app/(api)/relative/analytics+api.ts
  PURPOSE: GET /api/relative/analytics
           Returns profile-level analytics for the Profile screen
           Activity & Booking Summary section (Section 7). Powers
           react-native-gifted-charts monthly spending and booking
           frequency charts.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — const elderIds = await getRelativeElderIds(user.id)

  STEP 3 — Run all queries in parallel with Promise.all():

    QUERY A — Core metrics
      SELECT
        COUNT(*) FILTER (
          WHERE cs.status IN ('arriving','checked_in','paused')
        )::INT                                      AS active_sessions,
        COUNT(*) FILTER (
          WHERE cs.status = 'completed'
        )::INT                                      AS total_completed,
        COALESCE(SUM(p.amount) FILTER (
          WHERE p.status = 'succeeded'
            AND p.paid_at >= DATE_TRUNC('month', CURRENT_DATE)
        ), 0)::FLOAT                                AS monthly_spend
      FROM   care_sessions cs
      LEFT JOIN payments p ON p.session_id = cs.id
      WHERE  cs.elder_id = ANY(${elderIds}::int[])

    QUERY B — Average caregiver rating (from relative's own reviews)
      SELECT COALESCE(AVG(rating), 0)::FLOAT AS avg_rating
      FROM   reviews WHERE reviewer_user_id = ${user.id}

    QUERY C — Booking frequency by month (last 6 months)
      SELECT
        TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month_label,
        COUNT(cs.id)::INT                                 AS booking_count
      FROM generate_series(
             DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
             DATE_TRUNC('month', CURRENT_DATE),
             '1 month'::INTERVAL
           ) AS d(month)
      LEFT JOIN care_sessions cs
             ON cs.elder_id = ANY(${elderIds}::int[])
            AND DATE_TRUNC('month', cs.created_at) = d.month
      GROUP BY d.month
      ORDER BY d.month ASC

    QUERY D — Spending trend by month (last 6 months, from payments)
      SELECT
        TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month_label,
        COALESCE(SUM(p.amount), 0)::FLOAT                AS total_spent
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

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        activeCareSessions:       number,
        totalCompletedBookings:   number,
        monthlySpend:             number,
        averageCaregiverRating:   number,
        bookingFrequencyByMonth:  Array,
        spendingTrendByMonth:     Array,
      }
    }
    bookingFrequencyByMonth and spendingTrendByMonth each have 6 items.

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - All 4 queries run in parallel with Promise.all()
  - generate_series ensures zero-value months appear in both charts
  - averageCaregiverRating = 0 when no reviews (not null)
  - monthlySpend uses payments.amount (actual charged), not total_cost
    (estimated at booking time)
*/
