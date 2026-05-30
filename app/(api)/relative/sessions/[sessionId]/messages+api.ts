import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);

    const sessions = await db<any>`
      SELECT id, elder_id, booked_by_user_id
      FROM care_sessions
      WHERE id = ${sessionId}
    `;

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    await requireRelativeOwnership(user.id, session.elder_id);

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
          SELECT m.id, m.session_id, m.sender_user_id, m.content, m.message_type, m.is_read, m.created_at, u.name AS sender_name, u.role AS sender_role
          FROM messages m
          JOIN users u ON m.sender_user_id = u.id
          WHERE m.session_id = ${sessionId} AND m.id < ${cursorMatch}
          ORDER BY m.id DESC
          LIMIT ${limit + 1}
        `;
      }
    } else {
      rows = await db<any>`
        SELECT m.id, m.session_id, m.sender_user_id, m.content, m.message_type, m.is_read, m.created_at, u.name AS sender_name, u.role AS sender_role
        FROM messages m
        JOIN users u ON m.sender_user_id = u.id
        WHERE m.session_id = ${sessionId}
        ORDER BY m.id DESC
        LIMIT ${limit + 1}
      `;
    }

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    rows.reverse();
    const nextCursor = rows.length > 0 ? rows[0].id : null;

    return Response.json({
      success: true,
      data: { messages: rows, pagination: { hasMore, nextCursor, limit } },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/messages GET] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
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

    const { user } = await requireRelative(request);

    const sessions = await db<any>`
      SELECT cs.id, cs.elder_id, cs.booked_by_user_id, cs.caregiver_id
      FROM care_sessions cs
      WHERE cs.id = ${sessionId}
    `;

    if (!sessions || sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];
    await requireRelativeOwnership(user.id, session.elder_id);

    const contentTrimmed = body.content.trim();

    const inserted = await db<any>`
      INSERT INTO messages (session_id, sender_user_id, content, message_type, is_read)
      VALUES (${sessionId}, ${user.id}, ${contentTrimmed}, 'text', false)
      RETURNING id, session_id, sender_user_id, content, message_type, is_read, created_at
    `;

    const insertedMsg = inserted[0];

    const completeMessage = {
      ...insertedMsg,
      sender_name: user.name,
      sender_role: user.role,
    };

    // Fire-and-forget realtime broadcast
    void (async () => {
      try {
        await supabase
          .channel(`session:${sessionId}`)
          .send({
            type: "broadcast",
            event: "new_message",
            payload: completeMessage,
          });
      } catch (err) {
        console.error("[relative/messages] realtime error", err);
      }
    })();

    // Fire-and-forget push to caregiver
    void (async () => {
      try {
        const caregiverRows = await db<{ user_id: number }>`
          SELECT user_id FROM caregivers WHERE id = ${session.caregiver_id} LIMIT 1
        `;
        const caregiverUserId = caregiverRows?.[0]?.user_id;
        if (!caregiverUserId) return;

        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES (${caregiverUserId}, ${"New Message"}, ${user.name + " sent a message"}, ${"message"}, ${sessionId}, ${"care_session"})
        `;

        const tokens = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${caregiverUserId}
        `;

        const expoMessages = tokens.map((t) => ({
          to: t.token,
          title: user.name || "New Message",
          body: contentTrimmed.substring(0, 120),
          data: { session_id: sessionId, type: "message" },
        }));
        if (expoMessages.length > 0) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expoMessages),
          });
        }
      } catch (err) {
        console.error("[relative/messages] push error", err);
      }
    })();

    return Response.json(
      { success: true, data: { message: completeMessage } },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/messages POST] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions/[sessionId]/messages+api.ts
  PURPOSE: GET /api/relative/sessions/:sessionId/messages
           Returns paginated message thread for a session, with session
           context on first call. Marks inbound messages as read.
           Powers the Active Chat View (Section 3) in the Chat screen.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function GET(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  before: string  (message id — load messages older than this; cursor-based)
  limit:  string  (default '30', max 100)

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE messages    alias: m
    id, session_id, sender_user_id, content, message_type, is_read,
    created_at

  TABLE users       alias: u  (sender)
    id, name, role

  TABLE care_sessions   alias: cs
    id, elder_id, caregiver_id, care_type, status

  TABLE caregivers      alias: cg
    id, user_id

  TABLE users           alias: cu  (caregiver, for session context)
    id, name

  TABLE elders + users  (elder, for session context)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId + before + limit
    limit = Math.min(parseInt(limitParam ?? '30'), 100)
    cursor = before ? parseInt(before) : null

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')
             requireRelativeOwnership(user.id, session.elder_id) — see STEP 3

  STEP 3 — Fetch session for ownership check + context
    SELECT cs.id, cs.elder_id, cs.care_type, cs.status,
           cu.name AS caregiver_name, eu.name AS elder_name
    FROM   care_sessions cs
    JOIN   caregivers cg ON cs.caregiver_id = cg.id
    JOIN   users      cu ON cg.user_id      = cu.id
    JOIN   elders     e  ON cs.elder_id     = e.id
    JOIN   users      eu ON e.user_id       = eu.id
    WHERE  cs.id = ${sessionId}
    LIMIT  1
    404 if not found.
    requireRelativeOwnership(user.id, session.elder_id) → 403

  STEP 4 — Fetch messages (cursor-based pagination, chronological order)
    SELECT
      m.id, m.content, m.message_type, m.sender_user_id,
      m.is_read, m.created_at,
      u.name AS sender_name,
      u.role AS sender_role
    FROM   messages m
    JOIN   users u ON m.sender_user_id = u.id
    WHERE  m.session_id = ${sessionId}
      [AND m.id < ${cursor}  if cursor provided]
    ORDER  BY m.created_at ASC
    LIMIT  ${limit + 1}

  STEP 5 — Determine has_more
    has_more = rows.length > limit
    const msgs = has_more ? rows.slice(0, limit) : rows
    next_cursor = has_more ? msgs[0].id : null  // oldest message id in page

  STEP 6 — MARK INBOUND AS READ (fire-and-forget, try/catch)
    UPDATE messages
    SET    is_read = true
    WHERE  session_id    = ${sessionId}
      AND  sender_user_id != ${user.id}
      AND  is_read        = false

  STEP 7 — Return 200:
    {
      success: true,
      data: {
        session: {
          careType:      string,
          status:        string,
          caregiverName: string,
          elderName:     string,
        },
        messages: MessageRow[],
        pagination: { has_more, next_cursor, limit },
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Mark-as-read (STEP 6) is fire-and-forget — never await
  - cursor (before param) loads OLDER messages — next_cursor is the
    lowest id in the current page (for scroll-up pagination)
  - session context is included on every call (small, cached client-side)
  - Do NOT expose sender_user_id raw — only sender_name and sender_role



    PURPOSE: POST /api/relative/sessions/:sessionId/messages
           Sends a message from the relative to the caregiver.
           Validates the session is still active, inserts the message,
           broadcasts via Realtime, and pushes to caregiver device.

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  { content: string, message_type?: 'text' }
  Validate:
    - content: non-empty string, max 5000 characters
    - message_type: if provided must be 'text'
      (reject 'system' and 'care_update' — server-generated only)
  Return 400 on failure.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { supabase } from '@/lib/supabase'   (add to existing imports)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId + validate body

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — Fetch session + verify ownership + validate status
    (Same join pattern as GET handler above)
    If session.status IN ('completed', 'cancelled', 'declined') → 409:
      { error: 'Cannot send messages to a closed session' }

  STEP 4 — INSERT message
    INSERT INTO messages
      (session_id, sender_user_id, content, message_type, is_read)
    VALUES
      (${sessionId}, ${user.id}, ${body.content.trim()}, 'text', false)
    RETURNING id, session_id, sender_user_id, content, message_type,
              is_read, created_at

  STEP 5 — REALTIME BROADCAST (fire-and-forget, try/catch)
    Channel: 'session:${sessionId}:caregiver'
    Event:   'new_message'
    Payload:
      {
        id:            insertedMsg.id,
        session_id:    sessionId,
        sender_user_id: user.id,
        sender_name:   user.name,
        sender_role:   'relative',
        content:       insertedMsg.content,
        message_type:  'text',
        created_at:    insertedMsg.created_at,
      }

  STEP 6 — PUSH NOTIFY CAREGIVER (fire-and-forget, try/catch)
    Fetch caregiver.user_id via care_sessions JOIN caregivers.
    Fetch device_tokens WHERE user_id = caregiver.user_id.
    Send Expo push to each token:
      {
        to:    token,
        title: user.name,
        body:  body.content.substring(0, 100),
        data:  { session_id: sessionId, type: 'message' },
      }

  STEP 7 — Return 201:
    {
      success: true,
      data: {
        message: {
          messageId:   number,
          content:     string,
          createdAt:   string,
          senderName:  string,
          senderRole:  'relative',
        }
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Do NOT await STEP 5 or STEP 6 — both fire-and-forget
  - message_type 'system' and 'care_update' are NEVER accepted from client
  - content must be trimmed before insert and before push body preview
  - push body preview: content.substring(0, 100)
  - Blocked for completed/cancelled/declined sessions (STEP 3 guard)





  */
