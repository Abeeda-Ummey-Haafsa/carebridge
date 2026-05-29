import { getAuthenticatedUser, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

interface EmergencyAlertBody {
  elder_id: number;
  alert_type: string;
  session_id?: number;
  lat?: number;
  lng?: number;
}

interface AlertResponse {
  success: boolean;
  data: {
    alert_id: number;
    alert_type: string;
    elder_id: number;
    created_at: string;
  };
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Step 1: Parse + validate body
    const body: Partial<EmergencyAlertBody> = await request
      .json()
      .catch(() => ({}));

    if (typeof body.elder_id !== "number" || body.elder_id <= 0) {
      return Response.json(
        { error: "Valid positive integer elder_id is required" },
        { status: 400 },
      );
    }

    if (body.alert_type !== "sos" && body.alert_type !== "need_help") {
      return Response.json(
        { error: "alert_type must be 'sos' or 'need_help'" },
        { status: 400 },
      );
    }

    if (
      body.lat !== undefined &&
      (typeof body.lat !== "number" || body.lat < -90 || body.lat > 90)
    ) {
      return Response.json({ error: "Invalid lat range" }, { status: 400 });
    }

    if (
      body.lng !== undefined &&
      (typeof body.lng !== "number" || body.lng < -180 || body.lng > 180)
    ) {
      return Response.json({ error: "Invalid lng range" }, { status: 400 });
    }

    // Step 2: Authenticate user
    const user = await getAuthenticatedUser(request);

    // Step 3: INSERT emergency alert
    const alerts = await db<any>`
      INSERT INTO emergency_alerts (elder_id, session_id, alert_type, lat, lng)
      VALUES (
        ${body.elder_id},
        ${body.session_id ?? null},
        ${body.alert_type},
        ${body.lat ?? null},
        ${body.lng ?? null}
      )
      RETURNING id, elder_id, alert_type, created_at
    `;
    const insertedAlert = alerts[0];

    // Step 4: FETCH RELATIVES TO NOTIFY (fire-and-forget)
    (async () => {
      try {
        const relatives = await db<{
          relative_user_id: number;
          is_primary: boolean;
        }>`
          SELECT relative_user_id, is_primary
          FROM elder_relative_links
          WHERE elder_id = ${body.elder_id!}
        `;

        if (relatives.length === 0) return;

        const title =
          body.alert_type === "sos"
            ? "🚨 SOS Alert — Immediate Attention Required"
            : "⚠️ Help Requested";

        const bodyText =
          body.alert_type === "sos"
            ? "An emergency SOS has been triggered. Please respond immediately."
            : "Your elder has requested assistance.";

        for (const rel of relatives) {
          try {
            // Insert in-app notification
            await db`
              INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
              VALUES (${rel.relative_user_id}, ${title}, ${bodyText}, 'emergency', ${insertedAlert.id}, 'emergency_alert')
            `;

            // Fetch device tokens
            const tokens = await db<{ token: string }>`
              SELECT token FROM device_tokens WHERE user_id = ${rel.relative_user_id}
            `;

            if (tokens.length > 0) {
              const pushPayloads = tokens.map((t) => ({
                to: t.token,
                title,
                body: bodyText,
                data: {
                  alert_id: insertedAlert.id,
                  alert_type: body.alert_type,
                  elder_id: body.elder_id,
                  type: "emergency",
                },
                priority: "high",
                sound: "default",
              }));

              // Send push notifications
              for (const payload of pushPayloads) {
                await fetch("https://exp.host/--/api/v2/push/send", {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(payload),
                }).catch((e) =>
                  console.error("[emergency-alerts] Expo push send error:", e),
                );
              }
            }
          } catch (innerErr) {
            console.error("[emergency-alerts] Relative block error:", innerErr);
          }
        }
      } catch (notifyErr) {
        console.error("[emergency-alerts] Notification error:", notifyErr);
      }
    })();

    // Step 5: Return 201
    const responsePayload: AlertResponse = {
      success: true,
      data: {
        alert_id: insertedAlert.id,
        alert_type: insertedAlert.alert_type,
        elder_id: insertedAlert.elder_id,
        created_at: insertedAlert.created_at,
      },
    };

    return Response.json(responsePayload, { status: 201 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[emergency-alerts POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
