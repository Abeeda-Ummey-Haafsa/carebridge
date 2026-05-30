import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { alertId: string } },
) {
  try {
    const alertId = Number.parseInt(params.alertId, 10);

    if (Number.isNaN(alertId)) {
      return Response.json({ error: "Invalid alertId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);

    const alertRows = await db<{
      id: number;
      elder_id: number;
      alert_type: string;
      acknowledged_at: string | null;
    }>`
      SELECT ea.id, ea.elder_id, ea.alert_type, ea.acknowledged_at
      FROM   emergency_alerts ea
      WHERE  ea.id = ${alertId}
      LIMIT  1
    `;

    if (alertRows.length === 0) {
      return Response.json({ error: "Alert not found" }, { status: 404 });
    }

    const alert = alertRows[0];
    await requireRelativeOwnership(user.id, alert.elder_id);

    if (alert.acknowledged_at !== null) {
      return Response.json(
        { error: "Alert already acknowledged" },
        { status: 409 },
      );
    }

    const updatedRows = await db<{
      id: number;
      elder_id: number;
      alert_type: string;
      acknowledged_at: string;
    }>`
      UPDATE emergency_alerts
      SET    acknowledged_at = NOW(),
             acknowledged_by_user_id = ${user.id}
      WHERE  id = ${alertId}
      RETURNING id, elder_id, alert_type, acknowledged_at
    `;

    const updatedAlert = updatedRows[0];

    void (async () => {
      try {
        await supabase.channel(`elder:${updatedAlert.elder_id}`).send({
          type: "broadcast",
          event: "sos_acknowledged",
          payload: {
            alertId,
            acknowledgedByName: user.name,
            acknowledgedAt: updatedAlert.acknowledged_at,
          },
        });
      } catch (broadcastError) {
        console.error(
          "[relative/alerts acknowledge] broadcast failed",
          broadcastError,
        );
      }
    })();

    void (async () => {
      try {
        const tokenRows = await db<{ token: string }>`
          SELECT dt.token
          FROM   device_tokens dt
          JOIN   elders e ON dt.user_id = e.user_id
          WHERE  e.id = ${updatedAlert.elder_id}
        `;

        if (tokenRows.length === 0) {
          return;
        }

        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            tokenRows.map((row) => ({
              to: row.token,
              title: "Your family has received your alert",
              body: "Help is on the way.",
              data: {
                alert_id: alertId,
                type: "alert_acknowledged",
              },
            })),
          ),
        });
      } catch (pushError) {
        console.error("[relative/alerts acknowledge] push failed", pushError);
      }
    })();

    return Response.json({
      success: true,
      data: {
        alertId: updatedAlert.id,
        acknowledgedAt: updatedAlert.acknowledged_at,
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
