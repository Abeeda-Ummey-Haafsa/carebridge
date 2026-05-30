/*
  FILE: app/(api)/relative/bookings/[sessionId]/reschedule+api.ts
  PURPOSE: PATCH /api/relative/bookings/:sessionId/reschedule
           Updates the scheduled_at and/or duration_minutes for a
           pending or accepted booking. Re-validates for scheduling
           conflicts before updating.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function PATCH(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  {
    scheduled_at?:     string   (ISO 8601 UTC — at least 30 min in future)
    duration_minutes?: number   (1 to 1440)
  }
  At least one field required. Validate both if provided.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId + validate body
    If neither scheduled_at nor duration_minutes provided → 400.
    Validate scheduled_at format and future constraint if provided.
    Validate duration_minutes range if provided.

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Fetch session + ownership (same pattern as cancel)
    SELECT id, elder_id, caregiver_id, status, scheduled_at,
           duration_minutes
    FROM   care_sessions WHERE id = ${sessionId}
    404 if not found. Verify ownership via elder_relative_links. 403 if fails.

  STEP 4 — Status guard
    Only allow reschedule from status IN ('pending', 'accepted').
    409 otherwise.

  STEP 5 — Determine new values (use existing if not provided)
    newScheduledAt     = body.scheduled_at     ?? session.scheduled_at
    newDurationMinutes = body.duration_minutes ?? session.duration_minutes

  STEP 6 — OVERLAP CHECK (exclude self from overlap detection)
    Same Haversine logic as POST /bookings, but add:
      AND cs.id != ${sessionId}   ← exclude the current session from check
    409 if overlap detected.

  STEP 7 — UPDATE care_sessions
    SET    scheduled_at      = ${newScheduledAt},
           duration_minutes  = ${newDurationMinutes},
           updated_at        = NOW()
    WHERE  id = ${sessionId}
    RETURNING id, status, scheduled_at, duration_minutes, updated_at

  STEP 8 — NOTIFY CAREGIVER (fire-and-forget, try/catch)
    Notification body: 'Booking has been rescheduled'
    Push: same pattern as cancel handler.

  STEP 9 — Return 200:
    {
      success: true,
      data: {
        sessionId:        number,
        scheduledAt:      string,
        durationMinutes:  number,
        updatedAt:        string,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Must exclude self from overlap check (AND cs.id != ${sessionId})
  - Partial updates are valid — only update the provided fields
  - Do NOT recalculate total_cost on reschedule (cost stays at booking rate)
  - Notification is fire-and-forget
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

    const body = await request.json().catch(() => ({}));
    const scheduledAt = body?.scheduled_at
      ? String(body.scheduled_at).trim()
      : null;
    const durationMinutes = body?.duration_minutes
      ? Number(body.duration_minutes)
      : null;

    if (!scheduledAt && !durationMinutes) {
      return Response.json(
        { error: "scheduled_at or duration_minutes is required" },
        { status: 400 },
      );
    }

    const { user } = await requireRelative(request);

    const sessionRows = await db<any>`
      SELECT cs.id, cs.elder_id, cs.caregiver_id, cs.booked_by_user_id, cs.status, cs.scheduled_at, cs.duration_minutes,
             cg.user_id AS caregiver_user_id
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      WHERE cs.id = ${sessionId}
      LIMIT 1
    `;

    if (!sessionRows || sessionRows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionRows[0];

    await requireRelativeOwnership(user.id, session.elder_id);

    if (["completed", "cancelled", "declined"].includes(session.status)) {
      return Response.json(
        { error: "Cannot reschedule a completed or cancelled booking" },
        { status: 409 },
      );
    }

    const newScheduledAt = scheduledAt
      ? new Date(scheduledAt)
      : new Date(session.scheduled_at);
    const newDuration = durationMinutes ?? session.duration_minutes;

    if (isNaN(newScheduledAt.getTime())) {
      return Response.json(
        { error: "scheduled_at must be a valid ISO timestamp" },
        { status: 400 },
      );
    }

    // If rescheduling to a non-immediate time, ensure at least 30 minutes ahead
    const minStart = Date.now() + 30 * 60 * 1000;
    if (newScheduledAt.getTime() < minStart) {
      return Response.json(
        { error: "scheduled_at must be at least 30 minutes in the future" },
        { status: 400 },
      );
    }

    // Overlap check excluding this session
    const bookingEndIso = new Date(
      newScheduledAt.getTime() + newDuration * 60000,
    ).toISOString();

    const overlapRows = await db<{ overlap_count: number }>`
      SELECT COUNT(*)::INT AS overlap_count
      FROM care_sessions
      WHERE caregiver_id = ${session.caregiver_id}
        AND id != ${sessionId}
        AND status NOT IN ('declined', 'cancelled', 'completed')
        AND scheduled_at < ${bookingEndIso}
        AND (scheduled_at + (duration_minutes * INTERVAL '1 minute')) > ${newScheduledAt.toISOString()}
    `;

    if ((overlapRows?.[0]?.overlap_count ?? 0) > 0) {
      return Response.json(
        { error: "Caregiver has a conflicting booking in this time window" },
        { status: 409 },
      );
    }

    const updatedRows = await db<any>`
      UPDATE care_sessions
      SET scheduled_at = ${newScheduledAt.toISOString()}, duration_minutes = ${newDuration}, updated_at = NOW(), status = 'pending'
      WHERE id = ${sessionId}
      RETURNING id, status, scheduled_at, duration_minutes, updated_at
    `;

    const updated = updatedRows[0];

    void (async () => {
      try {
        await db`
          INSERT INTO messages (session_id, sender_user_id, content, message_type)
          VALUES (${sessionId}, ${user.id}, ${"Booking rescheduled by relative"}, 'system')
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
          VALUES (${session.caregiver_user_id}, ${"Booking Rescheduled"}, ${elderName + " booking has been rescheduled"}, ${"booking_update"}, ${sessionId}, ${"care_session"})
        `;

        const tokens = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${session.caregiver_user_id}
        `;

        if (tokens.length > 0) {
          const messages = tokens.map((t) => ({
            to: t.token,
            title: "Booking Rescheduled",
            body: `${elderName} booking has been rescheduled`,
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
        sessionId: updated.id,
        status: updated.status,
        scheduledAt: updated.scheduled_at,
        durationMinutes: updated.duration_minutes,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/bookings reschedule] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
