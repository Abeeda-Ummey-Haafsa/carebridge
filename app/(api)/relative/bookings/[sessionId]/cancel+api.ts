/*
  FILE: app/(api)/relative/bookings/[sessionId]/cancel+api.ts
  PURPOSE: PATCH /api/relative/bookings/:sessionId/cancel
           Cancels a pending or accepted booking. Blocked if the
           caregiver is already arriving or checked in. Notifies
           caregiver and inserts a system message.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function PATCH(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions
    id, elder_id, caregiver_id, booked_by_user_id, status, care_type,
    scheduled_at, updated_at

  TABLE caregivers   alias: cg
    id, user_id

  TABLE users        alias: cu   (caregiver user)
    id, name

  TABLE elder_relative_links   (for ownership verification)
  TABLE device_tokens          (for push notification)
  TABLE messages               (for system message)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Fetch session + verify relative ownership
    SELECT cs.id, cs.elder_id, cs.caregiver_id, cs.booked_by_user_id,
           cs.status, cs.care_type, cg.user_id AS caregiver_user_id,
           cu.name AS caregiver_name
    FROM   care_sessions cs
    JOIN   caregivers    cg ON cs.caregiver_id = cg.id
    JOIN   users         cu ON cg.user_id      = cu.id
    WHERE  cs.id = ${sessionId}
    LIMIT  1
    404 if not found.

    Verify: SELECT id FROM elder_relative_links
      WHERE elder_id = ${session.elder_id} AND relative_user_id = ${user.id}
    403 if relative not linked.

  STEP 4 — Status guard
    Only allow cancel from status IN ('pending', 'accepted').
    Any other status (arriving, checked_in, paused, completed, cancelled)
    → 409:
      {
        error: 'Booking can only be cancelled while pending or accepted',
        current_status: session.status,
      }

  STEP 5 — UPDATE care_sessions
    SET    status     = 'cancelled',
           updated_at = NOW()
    WHERE  id = ${sessionId}
    RETURNING id, status, updated_at

  STEP 6 — INSERT system message (fire-and-forget, try/catch)
    content      = 'Booking cancelled by relative'
    message_type = 'system'
    sender_user_id = user.id

  STEP 7 — NOTIFY CAREGIVER (fire-and-forget, try/catch)
    a) INSERT notification for caregiver:
         title        = 'Booking Cancelled'
         body         = 'Booking for ${elderName} has been cancelled'
         type         = 'booking_update'
         related_id   = sessionId
         related_type = 'care_session'
    b) Fetch device_tokens WHERE user_id = session.caregiver_user_id
    c) Send Expo push to each token.
    (Fetch elder name via elders JOIN users for the notification body)

  STEP 8 — Return 200:
    {
      success: true,
      data: {
        sessionId:  number,
        status:     'cancelled',
        updatedAt:  string,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Do NOT await STEP 6 or STEP 7 — fire-and-forget
  - Status guard must reject 'completed' bookings — cannot cancel history
  - Use 409 for invalid status transitions (semantic, not 400)
*/
import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);

    const sessionRows = await db<any>`
      SELECT cs.id, cs.elder_id, cs.caregiver_id, cs.booked_by_user_id, cs.status, cs.care_type,
             cg.user_id AS caregiver_user_id, cu.name AS caregiver_name
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users cu ON cg.user_id = cu.id
      WHERE cs.id = ${sessionId}
      LIMIT 1
    `;

    if (!sessionRows || sessionRows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionRows[0];

    await requireRelativeOwnership(user.id, session.elder_id);

    if (!["pending", "accepted"].includes(session.status)) {
      return Response.json(
        {
          error: "Booking can only be cancelled while pending or accepted",
          current_status: session.status,
        },
        { status: 409 },
      );
    }

    const updated = await db<any>`
      UPDATE care_sessions
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id, status, updated_at
    `;

    const updatedSession = updated[0];

    // Fire-and-forget: insert system message and notify caregiver
    void (async () => {
      try {
        await db`
          INSERT INTO messages (session_id, sender_user_id, content, message_type)
          VALUES (${sessionId}, ${user.id}, ${"Booking cancelled by relative"}, 'system')
        `;
      } catch (e) {
        console.error("Insert system message failed", e);
      }
    })();

    void (async () => {
      try {
        const elderRows = await db<any>`
          SELECT u.name AS elder_name FROM elders e JOIN users u ON e.user_id = u.id WHERE e.id = ${session.elder_id} LIMIT 1
        `;
        const elderName = elderRows?.[0]?.elder_name ?? "Elder";

        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES (${session.caregiver_user_id}, ${"Booking Cancelled"}, ${elderName + " booking has been cancelled"}, ${"booking_update"}, ${sessionId}, ${"care_session"})
        `;

        const tokens = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${session.caregiver_user_id}
        `;

        if (tokens.length > 0) {
          const messages = tokens.map((t) => ({
            to: t.token,
            title: "Booking Cancelled",
            body: `${elderName} booking has been cancelled`,
            data: { session_id: sessionId, type: "booking_update" },
          }));

          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messages),
          });
        }
      } catch (err) {
        console.error("Notify caregiver failed", err);
      }
    })();

    return Response.json({
      success: true,
      data: {
        sessionId: updatedSession.id,
        status: updatedSession.status,
        updatedAt: updatedSession.updated_at,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/bookings cancel] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
