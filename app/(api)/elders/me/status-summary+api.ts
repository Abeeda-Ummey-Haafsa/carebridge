import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    // Run parallel aggregation
    const [sessionRows, notesRows, sosRows] = await Promise.all([
      db<any>`
        SELECT cs.status, u.name as caregiver_name 
        FROM care_sessions cs
        JOIN caregivers cg ON cs.caregiver_id = cg.id
        JOIN users u ON cg.user_id = u.id
        WHERE cs.elder_id = ${elder.id}
          AND cs.status IN ('arriving', 'checked_in', 'paused')
        ORDER BY cs.scheduled_at DESC
        LIMIT 1
      `,
      db<any>`
        SELECT sn.content
        FROM session_notes sn
        JOIN care_sessions cs ON sn.session_id = cs.id
        WHERE cs.elder_id = ${elder.id}
          AND cs.status IN ('arriving', 'checked_in', 'paused')
        ORDER BY sn.created_at DESC
        LIMIT 1
      `,
      db<any>`
        SELECT id
        FROM emergency_alerts
        WHERE elder_id = ${elder.id}
          AND alert_type = 'sos'
          AND acknowledged_at IS NULL
        LIMIT 1
      `,
    ]);

    const activeSession = sessionRows[0]
      ? {
          status: sessionRows[0].status,
          caregiverName: sessionRows[0].caregiver_name,
        }
      : null;

    const lastNoteMessage = notesRows[0]?.content || null;
    const sosActive = sosRows.length > 0;

    // Simplification for prototype frontend needs
    const relativeOnline = false;

    return Response.json({
      success: true,
      data: {
        activeSession,
        lastNoteMessage,
        sosActive,
        relativeOnline,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/status-summary GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
