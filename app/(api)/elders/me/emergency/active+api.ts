import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    // Get the most recent unacknowledged SOS or help alert
    const rows = await db<any>`
      SELECT 
        id AS alertId, 
        alert_type AS alertType, 
        created_at AS createdAt, 
        false AS acknowledged
      FROM emergency_alerts
      WHERE elder_id = ${elder.id}
        AND acknowledged_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return Response.json({
      success: true,
      data: rows.length > 0 ? rows[0] : null,
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/emergency/active GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
