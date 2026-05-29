import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const [metricsRows, careTypeRows, earningsRows] = await Promise.all([
      db<any>`
        SELECT
          COALESCE(AVG(total_cost), 0)::FLOAT AS avg_payout,
          COALESCE(AVG(actual_duration_minutes), 0)::FLOAT AS avg_duration_minutes,
          COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_count,
          COUNT(*) FILTER (WHERE status IN ('accepted', 'declined'))::INT AS responded_count,
          COUNT(*) FILTER (WHERE status = 'accepted')::INT AS accepted_count
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
      `,
      db<any>`
        SELECT care_type, COUNT(*)::INT AS freq
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
          AND status = 'completed'
        GROUP BY care_type
        ORDER BY freq DESC
        LIMIT 1
      `,
      db<any>`
        SELECT COALESCE(SUM(total_cost), 0)::FLOAT AS weekly_earnings
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
          AND status = 'completed'
          AND scheduled_at >= CURRENT_DATE - INTERVAL '7 days'
      `,
    ]);

    const metricsRow = metricsRows[0] || {
      avg_payout: 0,
      avg_duration_minutes: 0,
      completed_count: 0,
      responded_count: 0,
      accepted_count: 0,
    };

    const mostCommonCareType =
      careTypeRows.length > 0 ? careTypeRows[0].care_type : null;
    const weeklyEarnings = earningsRows[0]?.weekly_earnings || 0;

    let responseRate: number | null = null;
    if (metricsRow.responded_count > 0) {
      responseRate = parseFloat(
        (
          (metricsRow.accepted_count / metricsRow.responded_count) *
          100
        ).toFixed(1),
      );
    }

    return Response.json({
      success: true,
      data: {
        avg_payout_per_session: metricsRow.avg_payout,
        avg_session_duration_mins: metricsRow.avg_duration_minutes,
        completed_sessions: metricsRow.completed_count,
        most_common_care_type: mostCommonCareType,
        response_rate_pct: responseRate,
        weekly_earnings: weeklyEarnings,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[caregivers/me/analytics GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

