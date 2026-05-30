import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);
    if (!elderIds || elderIds.length === 0) {
      return Response.json({ success: true, data: { totalUnread: 0 } });
    }

    const rows = await db<{ unread_count: number }>`
      SELECT COUNT(m.id)::INT AS unread_count
      FROM messages m
      JOIN care_sessions cs ON m.session_id = cs.id
      WHERE cs.elder_id = ANY(${elderIds}::int[])
        AND m.sender_user_id != ${user.id}
        AND m.is_read = false
    `;

    const total = rows?.[0]?.unread_count ?? 0;

    return Response.json({ success: true, data: { totalUnread: total } });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/conversations/unread-count] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/conversations/unread-count+api.ts
  PURPOSE: GET /api/relative/conversations/unread-count
           Returns total unread message count across ALL of the
           relative's sessions. Powers the Messages tab bar badge.
           Lightweight — called on app focus and after realtime events.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db }                                                from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — const elderIds = await getRelativeElderIds(user.id)
             If empty → return { totalUnread: 0 }

  STEP 3 — Single aggregation query
    SELECT COUNT(m.id)::INT AS unread_count
    FROM   messages m
    JOIN   care_sessions cs ON m.session_id = cs.id
    WHERE  cs.elder_id       = ANY(${elderIds}::int[])
      AND  m.sender_user_id != ${user.id}
      AND  m.is_read         = false

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        totalUnread: number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - NO side effects — does NOT mark messages as read
    (mark-as-read happens in the messages/read PATCH endpoint)
  - COUNT always returns a value — ::INT cast is sufficient, no COALESCE needed
  - Keep this handler minimal — no joins beyond what's needed for the count
  - Called on every app focus to keep badge accurate
*/
