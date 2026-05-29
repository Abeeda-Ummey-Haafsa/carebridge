import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { SessionNote } from "@/types/db";

const VALID_NOTE_TYPES = [
  "custom",
  "medication_given",
  "elder_resting",
  "meal_completed",
  "mobility_assistance",
  "blood_pressure_checked",
  "hydration_reminder",
  "other",
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse ID
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver } = await requireCaregiver(request);

    // Step 3: Verify session ownership
    const sessions = await db<any>`
      SELECT id, caregiver_id
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessions[0].caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 4: Fetch notes
    const notes = await db<any>`
      SELECT sn.id, sn.session_id, sn.author_user_id, sn.content,
             sn.note_type, sn.created_at,
             u.name AS author_name
      FROM session_notes sn
      JOIN users u ON sn.author_user_id = u.id
      WHERE sn.session_id = ${sessionId}
      ORDER BY sn.created_at DESC
    `;

    // Step 5: Return 200
    return Response.json(
      {
        success: true,
        data: {
          notes,
          total: notes.length,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[notes GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Parse body and validate
    const body = await request.json().catch(() => ({}));

    if (
      !body.content ||
      typeof body.content !== "string" ||
      body.content.trim().length === 0 ||
      body.content.length > 2000
    ) {
      return Response.json(
        { error: "Content is required and must be under 2000 characters" },
        { status: 400 },
      );
    }

    if (body.note_type && !VALID_NOTE_TYPES.includes(body.note_type)) {
      return Response.json(
        { error: "Invalid note_type provided" },
        { status: 400 },
      );
    }

    const noteType = body.note_type || "custom";

    // Step 1: Parse ID
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver, user } = await requireCaregiver(request);

    // Step 3: Verify session ownership
    const sessions = await db<any>`
      SELECT id, caregiver_id
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessions[0].caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 4: INSERT note
    const insertedNotes = await db<SessionNote>`
      INSERT INTO session_notes
        (session_id, author_user_id, content, note_type)
      VALUES
        (${sessionId}, ${user.id}, ${body.content.trim()}, ${noteType})
      RETURNING id, session_id, author_user_id, content, note_type, created_at
    `;
    const insertedNote = insertedNotes[0];

    // Step 5: REALTIME BROADCAST (fire-and-forget)
    (async () => {
      try {
        await supabase.channel(`session:${sessionId}`).send({
          type: "broadcast",
          event: "note_added",
          payload: {
            note_id: insertedNote.id,
            session_id: sessionId,
            content: insertedNote.content,
            note_type: insertedNote.note_type,
            created_at: insertedNote.created_at,
          },
        });
      } catch (broadcastErr) {
        console.error("[notes POST] Broadcast error:", broadcastErr);
      }
    })();

    // Step 6: Return 201
    return Response.json(
      {
        success: true,
        data: {
          note: {
            ...insertedNote,
            author_name: user.name,
          },
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[notes POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
