import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = Number.parseInt(params.sessionId, 10);

    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const sinceParam = new URL(request.url).searchParams.get("since");
    let sinceDate: Date | null = null;

    if (sinceParam) {
      const parsedDate = new Date(sinceParam);
      if (Number.isNaN(parsedDate.getTime())) {
        return Response.json(
          { error: "Invalid since timestamp" },
          { status: 400 },
        );
      }
      sinceDate = parsedDate;
    }

    const { user } = await requireRelative(request);

    const sessionRows = await db<{ elder_id: number }>`
      SELECT cs.elder_id
      FROM   care_sessions cs
      WHERE  cs.id = ${sessionId}
      LIMIT  1
    `;

    if (sessionRows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    await requireRelativeOwnership(user.id, sessionRows[0].elder_id);

    const notesQuery = sinceDate
      ? db<{
          note_id: number;
          content: string;
          note_type: string | null;
          created_at: string;
          caregiver_name: string;
        }>`
          SELECT
            sn.id AS note_id,
            sn.content,
            sn.note_type,
            sn.created_at,
            u.name AS caregiver_name
          FROM   session_notes sn
          JOIN   users u ON sn.author_user_id = u.id
          WHERE  sn.session_id = ${sessionId}
            AND  sn.created_at > ${sinceDate.toISOString()}
          ORDER  BY sn.created_at DESC
          LIMIT  20
        `
      : db<{
          note_id: number;
          content: string;
          note_type: string | null;
          created_at: string;
          caregiver_name: string;
        }>`
          SELECT
            sn.id AS note_id,
            sn.content,
            sn.note_type,
            sn.created_at,
            u.name AS caregiver_name
          FROM   session_notes sn
          JOIN   users u ON sn.author_user_id = u.id
          WHERE  sn.session_id = ${sessionId}
          ORDER  BY sn.created_at DESC
          LIMIT  20
        `;

    const tasksQuery = sinceDate
      ? db<{
          task_id: number;
          task_name: string;
          created_at: string;
        }>`
          SELECT
            st.id AS task_id,
            st.task_name,
            st.completed_at AS created_at
          FROM   session_tasks st
          WHERE  st.session_id = ${sessionId}
            AND  st.is_completed = true
            AND  st.completed_at IS NOT NULL
            AND  st.completed_at > ${sinceDate.toISOString()}
          ORDER  BY st.completed_at DESC
          LIMIT  20
        `
      : db<{
          task_id: number;
          task_name: string;
          created_at: string;
        }>`
          SELECT
            st.id AS task_id,
            st.task_name,
            st.completed_at AS created_at
          FROM   session_tasks st
          WHERE  st.session_id = ${sessionId}
            AND  st.is_completed = true
            AND  st.completed_at IS NOT NULL
          ORDER  BY st.completed_at DESC
          LIMIT  20
        `;

    const [notesRows, tasksRows] = await Promise.all([notesQuery, tasksQuery]);

    const updates = [
      ...notesRows.map((row, index) => ({
        id: row.note_id,
        type: "note" as const,
        content: row.content,
        noteType: row.note_type,
        caregiverName: row.caregiver_name,
        createdAt: row.created_at,
        sortOrder: index,
      })),
      ...tasksRows.map((row, index) => ({
        id: row.task_id,
        type: "task_completed" as const,
        content: row.task_name,
        noteType: null,
        caregiverName: null,
        createdAt: row.created_at,
        sortOrder: notesRows.length + index,
      })),
    ]
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt).getTime();
        const rightTime = new Date(right.createdAt).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return left.sortOrder - right.sortOrder;
      })
      .slice(0, 20)
      .map(({ sortOrder, ...update }) => update);

    return Response.json({
      success: true,
      data: {
        updates,
        total: updates.length,
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
