import { requireCaregiver, ApiAuthError } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { dispatchRealtimeNotification } from '@/app/(api)/caregivers/me/notification-preferences+api';

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
      return Response.json({ error: "Session not found or unauthorized to decline" }, { status: 403 });
    }

    const session = activeSessions[0];

    // DB: Update session status to declined
    const rows = await db<any>`
      UPDATE care_sessions
      SET 
        status = 'declined',
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING *
    `;

    const updatedSession = rows[0];

    // Realtime: Send push notification to relative
    // booked_by_user_id normally corresponds to relative mapping
    try {
      if (session.booked_by_user_id) {
        await dispatchRealtimeNotification(
           session.booked_by_user_id, 
           'message', // Treating as message alert here
           { message: `Request declined by caregiver for session ${sessionId}` }
        );
      }
    } catch (e) {
      console.error("Dispatch notification failed", e);
    }
    
    // Realtime: Emit session update events
    try {
      supabase.channel(`session_${sessionId}`).send({
        type: 'broadcast',
        event: 'status_changed',
        payload: { status: 'declined', session_id: sessionId }
      });
      console.log(`[Realtime emitted] session_${sessionId} declined`);
    } catch (err) {
      console.error("[Realtime] emit failed", err);
    }

    return Response.json({ success: true, data: updatedSession, message: "Session declined" }, { status: 200 });

  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[decline+api POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
