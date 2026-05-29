import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    const rows = await db<any>`
      SELECT 
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cs.checked_in_at,
        cs.duration_minutes,
        cs.elder_lat,
        cs.elder_lng,
        cg.id AS caregiver_id,
        u.name AS caregiver_name,
        EXTRACT(EPOCH FROM (NOW() - cs.checked_in_at))::INT AS elapsed_seconds
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users u ON cg.user_id = u.id
      WHERE cs.elder_id = ${elder.id}
        AND cs.status IN ('arriving', 'checked_in', 'paused')
      ORDER BY cs.scheduled_at DESC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({
        success: true,
        data: null,
      });
    }

    const session = rows[0];

    let estimated_end_time: string | null = null;
    let elapsed_seconds = session.elapsed_seconds || 0;

    if (session.checked_in_at && session.duration_minutes) {
      const checkedInDate = new Date(session.checked_in_at);
      const endTimeDate = new Date(
        checkedInDate.getTime() + session.duration_minutes * 60000,
      );
      estimated_end_time = endTimeDate.toISOString();
      if (session.status === "arriving") {
        elapsed_seconds = 0;
      }
    }

    return Response.json({
      success: true,
      data: {
        session_id: session.session_id,
        care_type: session.care_type,
        status: session.status,
        caregiver_name: session.caregiver_name,
        caregiver_id: session.caregiver_id,
        scheduled_at: session.scheduled_at,
        checked_in_at: session.checked_in_at,
        duration_minutes: session.duration_minutes,
        elder_lat: session.elder_lat,
        elder_lng: session.elder_lng,
        elapsed_seconds,
        estimated_end_time,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/active-session GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
