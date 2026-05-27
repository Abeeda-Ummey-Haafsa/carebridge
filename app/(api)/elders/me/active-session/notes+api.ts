import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    // 1. Get active session ID
    const sessionRows = await db<any>`
      SELECT id
      FROM care_sessions
      WHERE elder_id = ${elder.id}
        AND status IN ('arriving', 'checked_in', 'paused')
      ORDER BY scheduled_at DESC
      LIMIT 1
    `;

    if (sessionRows.length === 0) {
      return Response.json({ success: true, data: [] });
    }

    const sessionId = sessionRows[0].id;

    // 2. Fetch latest 5 notes
    const notes = await db<any>`
      SELECT id, content, note_type, created_at
      FROM session_notes
      WHERE session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return Response.json({
      success: true,
      data: notes,
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/active-session/notes GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
