/*
  ════════════════════════════════════════════════════════════════
  FILE A: app/(api)/caregivers/me/earnings/index+api.ts
  PURPOSE: GET /caregivers/me/earnings?period=today|week|month
           Earnings total + session count for a time period.
           Used by both Profile earnings cards and Session History
           earnings widgets.
  ════════════════════════════════════════════════════════════════

  ── QUERY PARAM ───────────────────────────────────────────────
  period: 'today' | 'week' | 'month'   Default: 'week'

  ── PERIOD → SQL INTERVAL MAPPING ────────────────────────────
  const PERIOD_MAP = {
    today: "scheduled_at >= CURRENT_DATE",
    week:  "scheduled_at >= CURRENT_DATE - INTERVAL '7 days'",
    month: "scheduled_at >= CURRENT_DATE - INTERVAL '30 days'",
  }

  ── STEPS ─────────────────────────────────────────────────────
  STEP 1 — requireCaregiver → { caregiver }
  STEP 2 — Validate period param against PERIOD_MAP keys
           If invalid → default to 'week' (do not 400)
  STEP 3 — Query
    SELECT
      COALESCE(SUM(total_cost), 0)::FLOAT AS earnings_total,
      COUNT(*)::INT                        AS session_count
    FROM   care_sessions
    WHERE  caregiver_id = ${caregiver.id}
      AND  status = 'completed'
      AND  [period SQL fragment]

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        period:         string,
        earnings_total: number,
        session_count:  number,
      }
    }

  ── CONSTRAINTS ──────────────────────────────────────────────
  - COALESCE earnings to 0 — SUM of empty set returns null
  - Cast to ::FLOAT and ::INT so Neon returns JS numbers not strings
  - Do NOT use payments table — use care_sessions.total_cost
    (payments table is for Stripe webhook records, not the source
    of truth for earnings display)

  ════════════════════════════════════════════════════════════════
  FILE B: app/(api)/caregivers/me/earnings/weekly-breakdown+api.ts
  PURPOSE: GET /caregivers/me/earnings/weekly-breakdown
           7-day breakdown for the bar chart in Profile screen.
           Returns one object per day for the last 7 days,
           including days with zero earnings.
  ════════════════════════════════════════════════════════════════

  ── STEPS ─────────────────────────────────────────────────────
  STEP 1 — requireCaregiver → { caregiver }
  STEP 2 — Generate date series for last 7 days (including today):
    Use SQL generate_series to ensure all 7 days appear even
    with no sessions:

    SELECT
      d.day::DATE                                 AS date,
      COALESCE(SUM(cs.total_cost), 0)::FLOAT      AS earnings,
      COUNT(cs.id)::INT                           AS session_count
    FROM generate_series(
           CURRENT_DATE - INTERVAL '6 days',
           CURRENT_DATE,
           '1 day'::INTERVAL
         ) AS d(day)
    LEFT JOIN care_sessions cs
           ON cs.caregiver_id = ${caregiver.id}
          AND cs.status       = 'completed'
          AND DATE(cs.scheduled_at) = d.day::DATE
    GROUP BY d.day
    ORDER BY d.day ASC

  STEP 3 — Return 200:
    {
      success: true,
      data: {
        breakdown: Array<{
          date:          string,    // 'YYYY-MM-DD'
          earnings:      number,
          session_count: number,
        }>
      }
    }

  ── CONSTRAINTS ──────────────────────────────────────────────
  - Use LEFT JOIN + generate_series — do NOT filter out zero-earning days
  - Always return exactly 7 items ordered oldest → newest

  ════════════════════════════════════════════════════════════════
  FILE C: app/(api)/caregivers/me/earnings/monthly-breakdown+api.ts
  PURPOSE: GET /caregivers/me/earnings/monthly-breakdown
           Last 6 months breakdown for the monthly trend chart.
  ════════════════════════════════════════════════════════════════

  ── STEPS ─────────────────────────────────────────────────────
  STEP 1 — requireCaregiver → { caregiver }
  STEP 2 — Query
    SELECT
      TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month,
      COALESCE(SUM(cs.total_cost), 0)::FLOAT           AS earnings,
      COUNT(cs.id)::INT                                AS session_count
    FROM generate_series(
           DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
           DATE_TRUNC('month', CURRENT_DATE),
           '1 month'::INTERVAL
         ) AS d(month)
    LEFT JOIN care_sessions cs
           ON cs.caregiver_id = ${caregiver.id}
          AND cs.status       = 'completed'
          AND DATE_TRUNC('month', cs.scheduled_at) = d.month
    GROUP BY d.month
    ORDER BY d.month ASC

  STEP 3 — Return 200:
    {
      success: true,
      data: {
        breakdown: Array<{
          month:         string,    // 'YYYY-MM'
          earnings:      number,
          session_count: number,
        }>
      }
    }

  ── CONSTRAINTS ──────────────────────────────────────────────
  - Always return exactly 6 items
  - month string format is 'YYYY-MM' (for chart x-axis labels)

  ════════════════════════════════════════════════════════════════
  FILE D: app/(api)/caregivers/me/earnings/history+api.ts
  PURPOSE: GET /caregivers/me/earnings/history
           Paginated per-session earnings list for the earnings
           history list in the Profile screen. Includes pending
           payout total.
  ════════════════════════════════════════════════════════════════

  ── QUERY PARAMS ──────────────────────────────────────────────
  cursor: string (last id from previous page)
  limit:  string (default 20, max 50)

  ── STEPS ─────────────────────────────────────────────────────
  STEP 1 — requireCaregiver → { caregiver }
  STEP 2 — Fetch paginated history
    SELECT
      cs.id, cs.care_type, cs.scheduled_at,
      cs.actual_duration_minutes, cs.total_cost,
      cs.status, cs.checked_out_at,
      u.name AS elder_name,
      p.status AS payment_status, p.paid_at
    FROM   care_sessions cs
    JOIN   elders e ON cs.elder_id = e.id
    JOIN   users  u ON e.user_id   = u.id
    LEFT JOIN payments p ON p.session_id = cs.id
    WHERE  cs.caregiver_id = ${caregiver.id}
      AND  cs.status = 'completed'
      [AND cs.id < ${cursor} if cursor provided]
    ORDER BY cs.scheduled_at DESC
    LIMIT ${limit + 1}

  STEP 3 — Compute pending_payout (separate query)
    SELECT COALESCE(SUM(cs.total_cost), 0)::FLOAT AS pending_total
    FROM   care_sessions cs
    LEFT JOIN payments p ON p.session_id = cs.id
    WHERE  cs.caregiver_id = ${caregiver.id}
      AND  cs.status = 'completed'
      AND  (p.id IS NULL OR p.status != 'succeeded')

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        history:         SessionEarningsRow[],
        pending_payout:  number,
        pagination:      { has_more, next_cursor, limit }
      }
    }
*/
