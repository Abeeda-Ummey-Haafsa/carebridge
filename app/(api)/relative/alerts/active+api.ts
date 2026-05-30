import {
  ApiAuthError,
  getRelativeElderIds,
  requireRelative,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);
    const elderIds = await getRelativeElderIds(user.id);

    if (elderIds.length === 0) {
      return Response.json({
        success: true,
        data: { alerts: [], hasActiveAlerts: false },
      });
    }

    const rows = await db<{
      alert_id: number;
      alert_type: string;
      session_id: number | null;
      created_at: string;
      elder_name: string;
      elder_id: number;
    }>`
      SELECT
        ea.id AS alert_id,
        ea.alert_type,
        ea.session_id,
        ea.created_at,
        u.name AS elder_name,
        e.id AS elder_id
      FROM   emergency_alerts ea
      JOIN   elders e ON ea.elder_id = e.id
      JOIN   users  u ON e.user_id   = u.id
      WHERE  ea.elder_id = ANY(${elderIds}::int[])
        AND  ea.acknowledged_at IS NULL
      ORDER  BY ea.created_at DESC
    `;

    return Response.json({
      success: true,
      data: {
        alerts: rows.map((row) => ({
          id: row.alert_id,
          alertType: row.alert_type,
          sessionId: row.session_id,
          createdAt: row.created_at,
          elderName: row.elder_name,
          elderId: row.elder_id,
        })),
        hasActiveAlerts: rows.length > 0,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
