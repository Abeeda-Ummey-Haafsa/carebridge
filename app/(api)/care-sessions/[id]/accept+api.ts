import { requireCaregiver, ApiAuthError } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { caregiver } = await requireCaregiver(request);
    const sessionId = parseInt(params.id, 10);

    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Auth: Validate caregiver ownership
    const activeSessions = await db<any>`
      SELECT * FROM care_sessions 
      WHERE id = ${sessionId} AND caregiver_id = ${caregiver.id}
    `;

    if (activeSessions.length === 0) {
      return Response.json({ error: "Session not found or unauthorized to accept" }, { status: 403 });
    }

    // DB: Update session status to accepted and store acceptance timestamp
    // Note: Schema has updated_at, which we can rely on, or directly map status
    const rows = await db<any>`
      UPDATE care_sessions
      SET 
        status = 'accepted',
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `;

    const updatedSession = rows[0];

    // Realtime: Emit session update event
    try {
      supabase.channel(`session_${sessionId}`).send({
        type: 'broadcast',
        event: 'status_changed',
        payload: { status: 'accepted', session_id: sessionId }
      });
      console.log(`[Realtime emitted] session_${sessionId} accepted`);
    } catch (err) {
      console.error("[Realtime] emit failed", err);
    }

    return Response.json({ success: true, data: updatedSession, message: "Session accepted" }, { status: 200 });

  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[accept+api POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
