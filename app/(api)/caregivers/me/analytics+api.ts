/*
  FILE: app/(api)/caregivers/me/analytics+api.ts
  PURPOSE: GET /caregivers/me/analytics
           Computed performance metrics for the Profile screen
           analytics section and Session History analytics preview.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireCaregiver, ApiAuthError } from '@/lib/server-auth'
  import { db }                             from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireCaregiver(request) → { caregiver }

  STEP 2 — Run all analytics queries in parallel with Promise.all():

    QUERY A — General metrics (single query)
      SELECT
        COALESCE(AVG(total_cost), 0)::FLOAT              AS avg_payout,
        COALESCE(AVG(actual_duration_minutes), 0)::FLOAT AS avg_duration_minutes,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_count,
        COUNT(*) FILTER (WHERE status IN ('accepted','declined'))::INT
                                                          AS responded_count,
        COUNT(*) FILTER (WHERE status = 'accepted')::INT  AS accepted_count
      FROM care_sessions
      WHERE caregiver_id = ${caregiver.id}

    QUERY B — Most common care type
      SELECT care_type, COUNT(*) AS freq
      FROM   care_sessions
      WHERE  caregiver_id = ${caregiver.id}
        AND  status = 'completed'
      GROUP  BY care_type
      ORDER  BY freq DESC
      LIMIT  1

    QUERY C — This week's earnings
      SELECT COALESCE(SUM(total_cost), 0)::FLOAT AS weekly_earnings
      FROM   care_sessions
      WHERE  caregiver_id = ${caregiver.id}
        AND  status = 'completed'
        AND  scheduled_at >= CURRENT_DATE - INTERVAL '7 days'

  STEP 3 — Compute response_rate
    const responseRate =
      metricsRow.responded_count > 0
        ? parseFloat(
            ((metricsRow.accepted_count / metricsRow.responded_count) * 100
            ).toFixed(1)
          )
        : null   // null = not enough data yet

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        avg_payout_per_session:    number,
        avg_session_duration_mins: number,
        completed_sessions:        number,
        most_common_care_type:     string | null,
        response_rate_pct:         number | null,
        weekly_earnings:           number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Use Promise.all for the three queries — never run them sequentially
  - response_rate_pct is null when responded_count = 0, not 0
    (null means "no data yet"; 0 means "never accepted a booking")
  - most_common_care_type is null if no completed sessions exist
  - All FLOAT casts prevent Neon returning numeric values as strings
*/
