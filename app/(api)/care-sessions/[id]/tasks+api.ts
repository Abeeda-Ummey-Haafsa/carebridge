import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import type { SessionTask } from "@/types/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse sessionId
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

    // Step 4: Fetch tasks
    const tasks = await db<SessionTask>`
      SELECT id, session_id, task_name, is_completed, notes,
             is_custom, sort_order, completed_at, created_at
      FROM session_tasks
      WHERE session_id = ${sessionId}
      ORDER BY sort_order ASC, created_at ASC
    `;

    // Calculate progress
    const total = tasks.length;
    const completedCount = tasks.filter((t) => t.is_completed).length;
    let progressPct = 0;
    if (total > 0) {
      progressPct = Math.round((completedCount / total) * 1000) / 10; // Round to 1 decimal place
    }

    // Step 5: Return 200
    return Response.json(
      {
        success: true,
        data: {
          tasks,
          total,
          completed_count: completedCount,
          progress_pct: progressPct,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[tasks GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Parse body
    const body = await request.json().catch(() => ({}));
    if (
      !body.task_name ||
      typeof body.task_name !== "string" ||
      body.task_name.trim().length === 0 ||
      body.task_name.length > 255
    ) {
      return Response.json(
        { error: "task_name is required and must be under 255 characters" },
        { status: 400 },
      );
    }

    const taskName = body.task_name.trim();

    // Step 1: Parse sessionId
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver } = await requireCaregiver(request);

    // Step 3: Verify session ownership
    const sessions = await db<any>`
      SELECT id, caregiver_id, status
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 4: Status guard
    if (session.status === "completed" || session.status === "cancelled") {
      return Response.json(
        { error: "Cannot add tasks to a completed or cancelled session" },
        { status: 409 },
      );
    }

    const allowedStatuses = ["checked_in", "paused", "arriving", "accepted"];
    if (!allowedStatuses.includes(session.status)) {
      return Response.json(
        { error: "Cannot add tasks at this session status" },
        { status: 409 },
      );
    }

    // Step 5: Determine sort_order for the new task
    const nextOrderRows = await db<any>`
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
      FROM session_tasks
      WHERE session_id = ${sessionId}
    `;
    const nextOrder = nextOrderRows[0].next_order;

    // Step 6: INSERT custom task
    const insertedTasks = await db<SessionTask>`
      INSERT INTO session_tasks
        (session_id, task_name, is_completed, is_custom, sort_order)
      VALUES
        (${sessionId}, ${taskName}, false, true, ${nextOrder})
      RETURNING *
    `;

    // Step 7: Return 201
    return Response.json(
      {
        success: true,
        data: { task: insertedTasks[0] },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[tasks POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
