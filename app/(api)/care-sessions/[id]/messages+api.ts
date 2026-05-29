import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const { caregiver, user } = await requireCaregiver(request);

    // Fetch session down to access control
    const sessions = await db<any>`
      SELECT id, caregiver_id, booked_by_user_id
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "Access denied to this session" },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");
    const limitQuery = url.searchParams.get("limit");
    let limit = limitQuery ? parseInt(limitQuery, 10) : 50;
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    let rows: any[] = [];

    if (cursor) {
      const cursorMatch = parseInt(cursor, 10);
      if (!isNaN(cursorMatch)) {
        rows = await db<any>`
          SELECT
            m.id, m.session_id, m.sender_user_id, m.content,
            m.message_type, m.is_read, m.created_at,
            u.name AS sender_name,
            u.role AS sender_role
          FROM messages m
          JOIN users u ON m.sender_user_id = u.id
          WHERE m.session_id = ${sessionId}
            AND m.id < ${cursorMatch}
          ORDER BY m.id DESC
          LIMIT ${limit + 1}
        `;
      }
    } else {
      rows = await db<any>`
        SELECT
          m.id, m.session_id, m.sender_user_id, m.content,
          m.message_type, m.is_read, m.created_at,
          u.name AS sender_name,
          u.role AS sender_role
        FROM messages m
        JOIN users u ON m.sender_user_id = u.id
        WHERE m.session_id = ${sessionId}
        ORDER BY m.id DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    if (hasMore) {
      rows.pop();
    }

    // Reverse array to render messages "oldest first" for client upward-scrolling chat window
    rows.reverse();

    const nextCursor = rows.length > 0 ? rows[0].id : null;

    // Fire-and-forget mark inbound messages as read
    Promise.resolve().then(async () => {
      try {
        await db`
          UPDATE messages
          SET is_read = true
          WHERE session_id = ${sessionId}
            AND sender_user_id != ${user.id}
            AND is_read = false
        `;
      } catch (err) {
        console.error("Failed to mark messages as read", err);
      }
    });

    return Response.json({
      success: true,
      data: {
        messages: rows,
        pagination: {
          has_more: hasMore,
          next_cursor: nextCursor,
          limit,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("GET messages error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    if (
      !body?.content ||
      typeof body.content !== "string" ||
      body.content.trim().length === 0 ||
      body.content.length > 5000
    ) {
      return Response.json(
        { error: "Valid content is required (max 5000 chars)" },
        { status: 400 },
      );
    }

    if (body.message_type && body.message_type !== "text") {
      return Response.json(
        { error: "message_type must be text for caregiver-sent messages" },
        { status: 400 },
      );
    }

    const { caregiver, user } = await requireCaregiver(request);

    // Verify session
    const sessions = await db<any>`
      SELECT id, caregiver_id, booked_by_user_id
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "Access denied to this session" },
        { status: 403 },
      );
    }

    const contentTrimmed = body.content.trim();

    // Insert new message
    const insertedMessages = await db<any>`
      INSERT INTO messages
        (session_id, sender_user_id, content, message_type, is_read)
      VALUES
        (${sessionId}, ${user.id}, ${contentTrimmed}, 'text', false)
      RETURNING id, session_id, sender_user_id, content, message_type, is_read, created_at
    `;

    const insertedMsg = insertedMessages[0];

    // Build composed message for realtime & response
    const completeMessage = {
      ...insertedMsg,
      sender_name: user.name,
      sender_role: user.role,
    };

    // Fire-and-forget realtime broadcast via Supabase
    Promise.resolve().then(async () => {
      try {
        const channel = supabase.channel(`session:${sessionId}`);
        await channel.send({
          type: "broadcast",
          event: "new_message",
          payload: completeMessage,
        });
      } catch (err) {
        console.error("Realtime broadcast error:", err);
      }
    });

    // Fire-and-forget Push Notification
    Promise.resolve().then(async () => {
      try {
        const tokens = await db<any>`
          SELECT push_token
          FROM device_tokens
          WHERE user_id = ${session.booked_by_user_id}
        `;

        const pushLimit = 100;
        const pushBodypreview = contentTrimmed.substring(0, pushLimit);
        const expoMessages = tokens.map((t: any) => ({
          to: t.push_token,
          title: user.name || "New Message",
          body: pushBodypreview,
          data: { session_id: sessionId, type: "message" },
        }));

        if (expoMessages.length > 0) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(expoMessages),
          });
        }
      } catch (err) {
        console.error("Push notification error:", err);
      }
    });

    return Response.json(
      {
        success: true,
        data: {
          message: completeMessage,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST messages error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
