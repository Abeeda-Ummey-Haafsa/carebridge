import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

interface CheckInBody {
  lat: number;
  lng: number;
}

interface CheckInResponse {
  success: boolean;
  data: {
    session_id: number;
    status: string;
    checked_in_at: string;
    tasks_seeded: number;
  };
}

const DEFAULT_TASKS: Record<string, string[]> = {
  companionship: [
    "Engage in conversation",
    "Light activity or game",
    "Hydration reminder",
    "Emotional check-in",
  ],
  medication_reminder: [
    "Verify correct medication",
    "Administer medication",
    "Log medication given",
    "Monitor for side effects",
  ],
  mobility_assistance: [
    "Assist with walking",
    "Physical therapy exercise",
    "Monitor balance and safety",
    "Hydration reminder",
  ],
  overnight_care: [
    "Evening medication check",
    "Prepare evening meal",
    "Assist with bedtime routine",
    "Monitor during night",
    "Morning check-in",
  ],
  medical_assistance: [
    "Monitor blood pressure",
    "Check blood sugar if needed",
    "Administer prescribed medication",
    "Document vitals",
    "Hydration reminder",
  ],
};

const GENERIC_TASKS = [
  "Check in with elder",
  "Hydration reminder",
  "Document observations",
];

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse + validate param and body
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body: Partial<CheckInBody> = await request.json().catch(() => ({}));
    const { lat, lng } = body;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return Response.json(
        { error: "Valid lat and lng are required" },
        { status: 400 },
      );
    }

    // Step 2: Authenticate caregiver
    const { caregiver, user } = await requireCaregiver(request);

    // Step 3: Fetch session
    const sessions = await db<any>`
      SELECT id, caregiver_id, elder_id, booked_by_user_id, care_type, status, elder_lat, elder_lng
      FROM care_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 4: Validate current status
    if (session.status !== "accepted" && session.status !== "arriving") {
      return Response.json(
        {
          error: "Session cannot be checked in from its current status",
          current_status: session.status,
        },
        { status: 409 },
      );
    }

    // Step 5: GPS Proximity Check
    if (session.elder_lat !== null && session.elder_lng !== null) {
      const R = 6371; // km
      const elderLat = Number(session.elder_lat);
      const elderLng = Number(session.elder_lng);

      const dLat = ((elderLat - lat) * Math.PI) / 180;
      const dLng = ((elderLng - lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((elderLat * Math.PI) / 180) *
          Math.sin(dLng / 2) ** 2;

      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (dist > 0.5) {
        return Response.json(
          {
            error: "You must be within 500m of the elder location to check in",
            distance_km: parseFloat(dist.toFixed(2)),
          },
          { status: 422 },
        );
      }
    }

    // Step 6: UPDATE session status
    const updatedSessions = await db<any>`
      UPDATE care_sessions
      SET
        status = 'checked_in',
        checked_in_at = NOW(),
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id, status, checked_in_at, care_type, elder_id, booked_by_user_id
    `;
    const updatedSession = updatedSessions[0];

    // Step 7: SEED DEFAULT TASK CHECKLIST
    const tasksToSeed =
      DEFAULT_TASKS[updatedSession.care_type] || GENERIC_TASKS;
    const sortOrders = tasksToSeed.map((_, i) => i);

    await db`
      INSERT INTO session_tasks (session_id, task_name, is_custom, sort_order)
      SELECT
        ${sessionId},
        t.name,
        false,
        t.sort
      FROM unnest(${tasksToSeed}::text[], ${sortOrders}::smallint[]) AS t(name, sort)
    `;

    // Step 8: INSERT SYSTEM MESSAGE
    await db`
      INSERT INTO messages (session_id, sender_user_id, content, message_type, is_read)
      VALUES (${sessionId}, ${user.id}, 'Caregiver checked in', 'system', false)
    `;

    // Step 9: NOTIFY RELATIVE (fire-and-forget)
    (async () => {
      try {
        const title = "Caregiver Checked In";
        const bodyText = "Your caregiver has arrived and started the session.";

        // Insert notification
        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES (${updatedSession.booked_by_user_id}, ${title}, ${bodyText}, 'session_update', ${sessionId}, 'care_session')
        `;

        // Fetch tokens
        const tokens = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${updatedSession.booked_by_user_id}
        `;

        if (tokens.length > 0) {
          const pushPayloads = tokens.map((t) => ({
            to: t.token,
            title,
            body: bodyText,
            data: { session_id: sessionId, type: "session_update" },
          }));

          // Send to expo
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
              console.error("[check-in] Expo push send error:", e),
            );
          }
        }
      } catch (notifyErr) {
        console.error("[check-in] Notification error:", notifyErr);
      }
    })();

    // Step 10: RETURN 200
    const responsePayload: CheckInResponse = {
      success: true,
      data: {
        session_id: updatedSession.id,
        status: updatedSession.status,
        checked_in_at: updatedSession.checked_in_at,
        tasks_seeded: tasksToSeed.length,
      },
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[check-in POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
