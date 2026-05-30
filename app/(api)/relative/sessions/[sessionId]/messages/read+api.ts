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

    const sessions =
      await db<any>`SELECT id, elder_id FROM care_sessions WHERE id = ${sessionId} LIMIT 1`;
    if (!sessions || sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    await requireRelativeOwnership(user.id, session.elder_id);

    const updated = await db<any>`
      UPDATE messages
      SET is_read = true
      WHERE session_id = ${sessionId}
        AND sender_user_id != ${user.id}
        AND is_read = false
      RETURNING id
    `;

    const count = updated?.length ?? 0;

    return Response.json({ success: true, data: { marked: count } });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/messages/read] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions/[sessionId]/messages/read+api.ts
  PURPOSE: PATCH /api/relative/sessions/:sessionId/messages/read
           Marks all unread inbound messages in a session as read.
           Optionally emits a read-receipt Realtime event to the
           caregiver side. Called when the conversation is opened or
           scrolled to the bottom.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function PATCH(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db }       from '@/lib/db'
  import { supabase } from '@/lib/supabase'

  ── NO REQUEST BODY ──────────────────────────────────────────────────────

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Fetch session elder_id + verify ownership
    SELECT elder_id FROM care_sessions WHERE id = ${sessionId}
    404 if not found.
    requireRelativeOwnership(user.id, session.elder_id) → 403

  STEP 4 — UPDATE messages
    UPDATE messages
    SET    is_read = true
    WHERE  session_id     = ${sessionId}
      AND  sender_user_id != ${user.id}
      AND  is_read         = false
    RETURNING id   ← use to get updatedCount

  STEP 5 — REALTIME BROADCAST (fire-and-forget, try/catch)
    Only emit if updatedCount > 0 (skip if nothing changed):
    Channel: 'session:${sessionId}'
    Event:   'messages_read'
    Payload: { session_id: sessionId, read_by: user.id,
               read_at: new Date().toISOString() }

  STEP 6 — Return 200:
    {
      success: true,
      data: {
        markedRead: number,   // count of messages updated
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Do NOT await the realtime broadcast — fire-and-forget
  - This endpoint is idempotent — calling it multiple times is safe
  - markedRead = 0 is a valid success response (all already read)
  - Emit Realtime event ONLY when markedRead > 0 (avoid noise)
*/
