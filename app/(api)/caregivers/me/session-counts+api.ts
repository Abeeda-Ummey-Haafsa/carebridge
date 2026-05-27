import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const rows = await db<any>`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status IN ('pending', 'accepted', 'arriving')) AS upcoming,
        COUNT(*) FILTER (WHERE status IN ('checked_in', 'paused')) AS active,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status IN ('declined', 'cancelled')) AS cancelled
      FROM care_sessions
      WHERE caregiver_id = ${caregiver.id}
    `;

    const row = rows[0] || {};

    return Response.json({
      success: true,
      data: {
        total: parseInt(row.total || "0", 10),
        upcoming: parseInt(row.upcoming || "0", 10),
        active: parseInt(row.active || "0", 10),
        completed: parseInt(row.completed || "0", 10),
        cancelled: parseInt(row.cancelled || "0", 10),
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET session-counts error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
