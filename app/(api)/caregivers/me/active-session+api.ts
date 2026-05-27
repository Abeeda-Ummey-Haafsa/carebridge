import { requireCaregiver, ApiAuthError } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { CareSession } from '@/types/db';

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const rows = await db<any>`
      SELECT 
        cs.*,
        u.name as elder_name
      FROM care_sessions cs
      JOIN elders e ON cs.elder_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE cs.caregiver_id = ${caregiver.id}
      AND cs.status IN ('arriving', 'checked_in', 'paused')
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new Response(null, { status: 204 });
    }

    const session = rows[0];

    // Compute elapsed seconds and estimated end time server-side
    let elapsed_seconds = 0;
    let estimated_end_time = null;

    if (session.checked_in_at) {
      const checkedInAt = new Date(session.checked_in_at).getTime();
      const now = new Date().getTime();
      elapsed_seconds = Math.max(0, Math.floor((now - checkedInAt) / 1000));
      
      estimated_end_time = new Date(
        checkedInAt + session.duration_minutes * 60000
      ).toISOString();
    } else if (session.scheduled_at) {
      const scheduledAt = new Date(session.scheduled_at).getTime();
      estimated_end_time = new Date(
        scheduledAt + session.duration_minutes * 60000
      ).toISOString();
    }

    const responseData = {
      success: true,
      data: {
        ...session,
        elapsed_seconds,
        estimated_end_time,
      },
    };

    return Response.json(responseData, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('[active-session+api]', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
