import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const url = new URL(request.url);
    const periodParam = url.searchParams.get("period");

    // Default to 'week' safely
    let period = "week";
    if (periodParam === "today" || periodParam === "month") {
      period = periodParam;
    }

    let rows: any[] = [];

    // Branching conditionally into parameterized queries instead of unsafe templated INTERVAL injection
    if (period === "today") {
      rows = await db<any>`
        SELECT
          COALESCE(SUM(total_cost), 0)::FLOAT AS earnings_total,
          COUNT(*)::INT AS session_count
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
          AND status = 'completed'
          AND scheduled_at >= CURRENT_DATE
      `;
    } else if (period === "month") {
      rows = await db<any>`
        SELECT
          COALESCE(SUM(total_cost), 0)::FLOAT AS earnings_total,
          COUNT(*)::INT AS session_count
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
          AND status = 'completed'
          AND scheduled_at >= CURRENT_DATE - INTERVAL '30 days'
      `;
    } else {
      // 'week' mode
      rows = await db<any>`
        SELECT
          COALESCE(SUM(total_cost), 0)::FLOAT AS earnings_total,
          COUNT(*)::INT AS session_count
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id}
          AND status = 'completed'
          AND scheduled_at >= CURRENT_DATE - INTERVAL '7 days'
      `;
    }

    const result = rows[0] || { earnings_total: 0, session_count: 0 };

    return Response.json({
      success: true,
      data: {
        period,
        earnings_total: result.earnings_total,
        session_count: result.session_count,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[caregivers/me/earnings GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
