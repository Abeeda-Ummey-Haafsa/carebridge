import {
  ApiAuthError,
  getRelativeElderIds,
  requireRelative,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);
    const elderIds = await getRelativeElderIds(user.id);

    if (elderIds.length === 0) {
      return Response.json({ success: true, data: null });
    }

    const rows = await db<{
      session_id: number;
      care_type: string;
      status: string;
      scheduled_at: string;
      checked_in_at: string | null;
      duration_minutes: number;
      caregiver_name: string;
      caregiver_id: number;
      caregiver_rating: number | null;
      elder_name: string;
      elder_id: number;
    }>`
      SELECT
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cs.checked_in_at,
        cs.duration_minutes,
        cu.name AS caregiver_name,
        cg.id AS caregiver_id,
        COALESCE(cg.avg_rating, 0)::FLOAT AS caregiver_rating,
        eu.name AS elder_name,
        e.id AS elder_id
      FROM   care_sessions cs
      JOIN   caregivers cg ON cs.caregiver_id = cg.id
      JOIN   users      cu ON cg.user_id      = cu.id
      JOIN   elders     e  ON cs.elder_id     = e.id
      JOIN   users      eu ON e.user_id       = eu.id
      WHERE  cs.elder_id = ANY(${elderIds}::int[])
        AND  cs.status   IN ('arriving', 'checked_in', 'paused')
      ORDER  BY cs.scheduled_at DESC
      LIMIT  1
    `;

    if (rows.length === 0) {
      return Response.json({ success: true, data: null });
    }

    const session = rows[0];
    const checkedInAt = session.checked_in_at;
    const elapsedSeconds = checkedInAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(checkedInAt).getTime()) / 1000),
        )
      : 0;
    const estimatedEndTime = checkedInAt
      ? new Date(
          new Date(checkedInAt).getTime() + session.duration_minutes * 60_000,
        ).toISOString()
      : null;

    return Response.json({
      success: true,
      data: {
        sessionId: session.session_id,
        careType: session.care_type,
        status: session.status,
        scheduledAt: session.scheduled_at,
        checkedInAt,
        durationMinutes: session.duration_minutes,
        estimatedEndTime,
        elapsedSeconds,
        caregiverName: session.caregiver_name,
        caregiverId: session.caregiver_id,
        caregiverRating: session.caregiver_rating ?? 0,
        elderName: session.elder_name,
        elderId: session.elder_id,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
