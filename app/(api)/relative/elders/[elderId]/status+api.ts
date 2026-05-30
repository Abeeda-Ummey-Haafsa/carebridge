import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { elderId: string } },
) {
  try {
    const elderId = Number.parseInt(params.elderId, 10);

    if (Number.isNaN(elderId)) {
      return Response.json({ error: "Invalid elderId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);
    await requireRelativeOwnership(user.id, elderId);

    const elderRows = await db<{
      id: number;
      name: string;
      mobility_level: string | null;
      allergies: string | null;
    }>`
      SELECT e.id, u.name, e.mobility_level, e.allergies
      FROM   elders e
      JOIN   users  u ON e.user_id = u.id
      WHERE  e.id = ${elderId}
      LIMIT  1
    `;

    if (elderRows.length === 0) {
      return Response.json({ error: "Elder not found" }, { status: 404 });
    }

    const [activeSessionRows, lastCheckinRows] = await Promise.all([
      db<{
        session_id: number;
        status: string;
        care_type: string;
        checked_in_at: string | null;
        caregiver_name: string;
      }>`
        SELECT
          cs.id AS session_id,
          cs.status,
          cs.care_type,
          cs.checked_in_at,
          cu.name AS caregiver_name
        FROM   care_sessions cs
        JOIN   caregivers cg ON cs.caregiver_id = cg.id
        JOIN   users      cu ON cg.user_id      = cu.id
        WHERE  cs.elder_id = ${elderId}
          AND  cs.status   IN ('arriving', 'checked_in', 'paused')
        ORDER  BY cs.scheduled_at DESC
        LIMIT  1
      `,
      db<{ checked_in_at: string | null }>`
        SELECT checked_in_at
        FROM   care_sessions
        WHERE  elder_id = ${elderId}
          AND  checked_in_at IS NOT NULL
        ORDER  BY checked_in_at DESC
        LIMIT  1
      `,
    ]);

    const activeSession = activeSessionRows[0]
      ? {
          sessionId: activeSessionRows[0].session_id,
          status: activeSessionRows[0].status,
          careType: activeSessionRows[0].care_type,
          caregiverName: activeSessionRows[0].caregiver_name,
        }
      : null;

    return Response.json({
      success: true,
      data: {
        elderName: elderRows[0].name,
        mobilityLevel: elderRows[0].mobility_level,
        careStatus: activeSession ? "active" : "none",
        lastCheckinAt: lastCheckinRows[0]?.checked_in_at ?? null,
        activeSession,
        medicationReminderPlaceholder: null,
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
