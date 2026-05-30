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
      return Response.json({ success: true, data: { updates: [], total: 0 } });
    }

    const rows = await db<{
      update_id: number;
      content: string;
      note_type: string | null;
      created_at: string;
      caregiver_name: string;
      elder_name: string;
      session_id: number;
      care_type: string;
    }>`
      SELECT
        sn.id AS update_id,
        sn.content,
        sn.note_type,
        sn.created_at,
        u.name AS caregiver_name,
        eu.name AS elder_name,
        cs.id AS session_id,
        cs.care_type
      FROM   session_notes sn
      JOIN   care_sessions cs ON sn.session_id = cs.id
      JOIN   users         u  ON sn.author_user_id = u.id
      JOIN   elders        e  ON cs.elder_id = e.id
      JOIN   users         eu ON e.user_id = eu.id
      WHERE  cs.elder_id = ANY(${elderIds}::int[])
        AND  cs.status   IN ('arriving', 'checked_in', 'paused')
      ORDER  BY sn.created_at DESC
      LIMIT  15
    `;

    return Response.json({
      success: true,
      data: {
        updates: rows.map((row) => ({
          id: row.update_id,
          type: "note",
          content: row.content,
          noteType: row.note_type,
          caregiverName: row.caregiver_name,
          elderName: row.elder_name,
          sessionId: row.session_id,
          careType: row.care_type,
          createdAt: row.created_at,
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
