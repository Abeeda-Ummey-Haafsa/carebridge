/*
  FILE: app/(api)/relative/notifications+api.ts
  PURPOSE: GET /api/relative/notifications
           Returns paginated in-app notifications for the relative.
           Supports unread-only filter. Used by the notifications
           feed and unread badge in the Profile screen.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  unread_only: string  ('true' | 'false', default 'false')
  limit:       string  (default '20', max 50)
  cursor:      string  (last notification id, for cursor pagination)

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE notifications
    id           SERIAL PK
    user_id      INTEGER NOT NULL
    title        VARCHAR(255) NOT NULL
    body         TEXT NOT NULL
    type         VARCHAR(50)
    related_id   INTEGER   nullable
    related_type VARCHAR(50) nullable
    is_read      BOOLEAN DEFAULT false
    created_at   TIMESTAMP

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse params
    unreadOnly = params.get('unread_only') === 'true'
    limit = Math.min(parseInt(params.get('limit') ?? '20'), 50)
    cursor = params.get('cursor') ? parseInt(params.get('cursor')!) : null

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — Query
    SELECT id, title, body, type, related_id, related_type,
           is_read, created_at
    FROM   notifications
    WHERE  user_id = ${user.id}
      [AND is_read = false  if unreadOnly]
      [AND id < ${cursor}   if cursor provided]
    ORDER  BY created_at DESC
    LIMIT  ${limit + 1}

  STEP 4 — Determine has_more
    has_more    = rows.length > limit
    const data  = has_more ? rows.slice(0, limit) : rows
    next_cursor = has_more ? data[data.length - 1].id : null

  STEP 5 — Return 200:
    {
      success: true,
      data: {
        notifications: Array,
        pagination: { has_more, next_cursor, limit }
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Use cursor pagination (not OFFSET) — supports infinite scroll
  - Do NOT mark as read on GET — separate PATCH endpoint handles that
  - Filter user_id = req.user.id on every query — never leak notifications
*/

import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") ?? "20", 10) || 20,
      50,
    );
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? parseInt(cursorParam, 10) : null;

    const { user } = await requireRelative(request);

    let rows: any[];

    if (unreadOnly && cursor) {
      rows = await db`
        SELECT id, title, body, type, related_id, related_type, is_read, created_at
        FROM notifications
        WHERE user_id = ${user.id} AND is_read = false AND id < ${cursor}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    } else if (unreadOnly) {
      rows = await db`
        SELECT id, title, body, type, related_id, related_type, is_read, created_at
        FROM notifications
        WHERE user_id = ${user.id} AND is_read = false
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    } else if (cursor) {
      rows = await db`
        SELECT id, title, body, type, related_id, related_type, is_read, created_at
        FROM notifications
        WHERE user_id = ${user.id} AND id < ${cursor}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    } else {
      rows = await db`
        SELECT id, title, body, type, related_id, related_type, is_read, created_at
        FROM notifications
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT ${limit + 1}
      `;
    }

    const list = rows || [];
    const hasMore = list.length > limit;
    const data = hasMore ? list.slice(0, limit) : list;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return Response.json({
      success: true,
      data: {
        notifications: data,
        pagination: { has_more: hasMore, next_cursor: nextCursor, limit },
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/notifications GET] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
