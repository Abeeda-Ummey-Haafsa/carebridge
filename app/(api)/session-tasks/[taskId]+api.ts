import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import type { SessionTask } from "@/types/db";

interface SessionTaskUpdateBody {
  is_completed: boolean;
  notes?: string | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } },
): Promise<Response> {
  try {
    // Step 1: Parse taskId + validate body
    const taskId = parseInt(params.taskId, 10);
    if (isNaN(taskId)) {
      return Response.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.is_completed !== "boolean") {
      return Response.json(
        { error: "is_completed is required and must be a boolean" },
        { status: 400 },
      );
    }

    // Step 2: Authenticate caregiver
    const { caregiver, user } = await requireCaregiver(request);

    // Step 3: Fetch the task JOIN session to verify ownership
    const tasks = await db<any>`
      SELECT st.id, st.session_id, st.task_name, st.is_completed, st.notes,
             cs.caregiver_id, cs.booked_by_user_id
      FROM session_tasks st
      JOIN care_sessions cs ON st.session_id = cs.id
      WHERE st.id = ${taskId}
      LIMIT 1
    `;

    if (tasks.length === 0) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    const task = tasks[0];

    if (task.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this task" },
        { status: 403 },
      );
    }

    // Step 4: Build UPDATE
    const notesValue = "notes" in body ? body.notes : task.notes;

    let updatedTasks: SessionTask[];

    if (body.is_completed) {
      updatedTasks = await db<SessionTask>`
        UPDATE session_tasks
        SET is_completed = true,
            completed_at = NOW(),
            notes = ${notesValue}
        WHERE id = ${taskId}
        RETURNING id, session_id, task_name, is_completed, notes, is_custom, sort_order, completed_at, created_at
      `;
    } else {
      updatedTasks = await db<SessionTask>`
        UPDATE session_tasks
        SET is_completed = false,
            completed_at = NULL,
            notes = ${notesValue}
        WHERE id = ${taskId}
        RETURNING id, session_id, task_name, is_completed, notes, is_custom, sort_order, completed_at, created_at
      `;
    }
    const updatedTask = updatedTasks[0];

    // Step 5: AUTO-INSERT care_update MESSAGE (fire-and-forget)
    if (body.is_completed) {
      (async () => {
        try {
          const content = `${task.task_name} — completed`;
          await db`
            INSERT INTO messages (session_id, sender_user_id, content, message_type, is_read)
            VALUES (${task.session_id}, ${user.id}, ${content}, 'care_update', false)
          `;
        } catch (msgErr) {
          console.error("[taskId PATCH] care_update insert error:", msgErr);
        }
      })();
    }

    // Step 6: Return 200
    return Response.json(
      {
        success: true,
        data: {
          task: updatedTask,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[taskId PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
