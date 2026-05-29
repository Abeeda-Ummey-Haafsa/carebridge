import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    // Generates a proper exact 6 month timeseries matching the `YYYY-MM` spec formatting labels dynamically.
    const rows = await db<any>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', d.month), 'YYYY-MM') AS month,
        COALESCE(SUM(cs.total_cost), 0)::FLOAT AS earnings,
        COUNT(cs.id)::INT AS session_count
      FROM generate_series(
             DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
             DATE_TRUNC('month', CURRENT_DATE),
             '1 month'::INTERVAL
           ) AS d(month)
      LEFT JOIN care_sessions cs
             ON cs.caregiver_id = ${caregiver.id}
            AND cs.status = 'completed'
            AND DATE_TRUNC('month', cs.scheduled_at) = d.month
      GROUP BY d.month
      ORDER BY d.month ASC
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
    console.error("[caregivers/me/earnings/monthly-breakdown GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
