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
      return Response.json({ success: true, data: { bookings: [], total: 0 } });
    }

    const rows = await db<{
      session_id: number;
      care_type: string | null;
      status: string | null;
      scheduled_at: string;
      duration_minutes: number;
      hourly_rate: number | null;
      estimated_cost: number | null;
      caregiver_name: string;
      caregiver_rating: number | null;
      elder_name: string;
      countdown_seconds: number;
    }>`
      SELECT
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cs.duration_minutes,
        cs.hourly_rate,
        COALESCE(cs.total_cost,
          ROUND((cs.duration_minutes::DECIMAL / 60) * cs.hourly_rate, 2)
        ) AS estimated_cost,
        cu.name AS caregiver_name,
        COALESCE(cg.avg_rating, 0)::FLOAT AS caregiver_rating,
        eu.name AS elder_name,
        EXTRACT(EPOCH FROM (cs.scheduled_at - NOW()))::INT AS countdown_seconds
      FROM   care_sessions cs
      JOIN   caregivers cg ON cs.caregiver_id = cg.id
      JOIN   users      cu ON cg.user_id      = cu.id
      JOIN   elders     e  ON cs.elder_id     = e.id
      JOIN   users      eu ON e.user_id       = eu.id
      WHERE  cs.elder_id = ANY(${elderIds}::int[])
        AND  cs.status   IN ('pending', 'accepted')
        AND  cs.scheduled_at > NOW()
      ORDER  BY cs.scheduled_at ASC
      LIMIT  10
    `;

    return Response.json({
      success: true,
      data: {
        bookings: rows.map((row) => ({
          sessionId: row.session_id,
          careType: row.care_type,
          status: row.status,
          scheduledAt: row.scheduled_at,
          durationMinutes: row.duration_minutes,
          hourlyRate: row.hourly_rate,
          estimatedCost: row.estimated_cost,
          caregiverName: row.caregiver_name,
          caregiverRating: row.caregiver_rating ?? 0,
          elderName: row.elder_name,
          countdownSeconds: row.countdown_seconds,
        })),
        total: rows.length,
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
