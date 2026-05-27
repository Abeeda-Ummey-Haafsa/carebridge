import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

interface StatusUpdateBody {
  status: string;
}

interface StatusUpdateResponse {
  success: boolean;
  data: {
    session_id: number;
    status: string;
    updated_at: string;
  };
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  accepted: ["arriving"],
  arriving: ["checked_in"],
  checked_in: ["paused"],
  paused: ["checked_in"],
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse param + body, validate target status string
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body: Partial<StatusUpdateBody> = await request
      .json()
      .catch(() => ({}));
    if (!body.status) {
      return Response.json(
        { error: "Target status is required" },
        { status: 400 },
      );
    }

    if (!["arriving", "paused", "checked_in"].includes(body.status)) {
      return Response.json({ error: "Invalid target status" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver } = await requireCaregiver(request);

    // Step 3: Fetch session
    const sessions = await db<any>`
      SELECT id, caregiver_id, status
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

    // Step 4: Validate transition against ALLOWED_TRANSITIONS
    const allowed = ALLOWED_TRANSITIONS[session.status] ?? [];
    if (!allowed.includes(body.status)) {
      return Response.json(
        {
          error: "Invalid status transition",
          current_status: session.status,
          target_status: body.status,
          allowed_from_current: allowed,
        },
        { status: 422 },
      );
    }

    // Step 5: UPDATE care_sessions
    const updatedSessions = await db<any>`
      UPDATE care_sessions
      SET
        status = ${body.status},
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id, status, updated_at
    `;
    const updatedSession = updatedSessions[0];

    // Step 6: REALTIME BROADCAST (fire-and-forget)
    (async () => {
      try {
        await supabase.channel(`session:${sessionId}`).send({
          type: "broadcast",
          event: "session_status_changed",
          payload: {
            session_id: sessionId,
            status: updatedSession.status,
            updated_at: updatedSession.updated_at,
            caregiver_id: caregiver.id,
          },
        });
      } catch (broadcastErr) {
        console.error("[status PATCH] Broadcast error:", broadcastErr);
      }
    })();

    // Step 7: Return 200
    const responsePayload: StatusUpdateResponse = {
      success: true,
      data: {
        session_id: updatedSession.id,
        status: updatedSession.status,
        updated_at: updatedSession.updated_at,
      },
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[status PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
