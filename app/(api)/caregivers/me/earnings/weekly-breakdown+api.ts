import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    // Provide default mappings handling 0 metrics efficiently utilizing PostgreSQL's native generate_series
    const rows = await db<any>`
      SELECT
        d.day::DATE AS date,
        COALESCE(SUM(cs.total_cost), 0)::FLOAT AS earnings,
        COUNT(cs.id)::INT AS session_count
      FROM generate_series(
             CURRENT_DATE - INTERVAL '6 days',
             CURRENT_DATE,
             '1 day'::INTERVAL
           ) AS d(day)
      LEFT JOIN care_sessions cs
             ON cs.caregiver_id = ${caregiver.id}
            AND cs.status = 'completed'
            AND DATE(cs.scheduled_at) = d.day::DATE
      GROUP BY d.day
      ORDER BY d.day ASC
    `;

    return Response.json({
      success: true,
      data: {
        breakdown: rows || [],
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[caregivers/me/earnings/weekly-breakdown GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
