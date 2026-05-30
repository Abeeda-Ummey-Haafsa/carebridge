import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

const FILTER_MAP: Record<string, string[]> = {
  all: [
    "pending",
    "accepted",
    "arriving",
    "checked_in",
    "paused",
    "completed",
    "cancelled",
    "declined",
  ],
  active: ["arriving", "checked_in", "paused"],
  archived: ["completed", "cancelled", "declined"],
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filter = String(url.searchParams.get("filter") ?? "all");
    const search = String(url.searchParams.get("search") ?? "").trim();

    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);
    if (!elderIds || elderIds.length === 0) {
      return Response.json({
        success: true,
        data: { conversations: [], totalUnread: 0 },
      });
    }

    const statusFilter = FILTER_MAP[filter] ?? FILTER_MAP.all;
    const searchWildcard = search ? `%${search}%` : null;

    const rows = await db<any>`
      WITH last_msgs AS (
        SELECT DISTINCT ON (session_id) session_id, content AS last_message, created_at AS last_message_at
        FROM messages
        ORDER BY session_id, created_at DESC
      ),
      unread_counts AS (
        SELECT session_id, COUNT(*)::INT AS unread_count
        FROM messages
        WHERE sender_user_id != ${user.id} AND is_read = false
        GROUP BY session_id
      )
      SELECT
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cu.name AS caregiver_name,
        eu.name AS elder_name,
        lm.last_message,
        lm.last_message_at,
        COALESCE(uc.unread_count, 0)::INT AS unread_count
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users cu ON cg.user_id = cu.id
      JOIN elders e ON cs.elder_id = e.id
      JOIN users eu ON e.user_id = eu.id
      LEFT JOIN last_msgs lm ON lm.session_id = cs.id
      LEFT JOIN unread_counts uc ON uc.session_id = cs.id
      WHERE cs.elder_id = ANY(${elderIds}::int[])
        AND (${filter} = 'unread' OR cs.status = ANY(${statusFilter}::varchar[]))
        AND (${searchWildcard} IS NULL OR (cu.name ILIKE ${searchWildcard} OR eu.name ILIKE ${searchWildcard}))
      ORDER BY COALESCE(lm.last_message_at, cs.created_at) DESC
    `;

    const totalUnread = (rows || []).reduce(
      (sum: number, r: any) => sum + (r.unread_count ?? 0),
      0,
    );

    return Response.json({
      success: true,
      data: { conversations: rows || [], totalUnread },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/conversations] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/conversations+api.ts
  PURPOSE: GET /api/relative/conversations
           Returns all conversation threads for the relative's linked
           elders with last message, unread count, and session context.
           Powers the Conversation List View in the Chat screen (Section 1).

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  filter: 'all' | 'active' | 'unread' | 'archived'   Default: 'all'
  search: string — search by caregiver name or elder name

  ── FILTER → STATUS MAPPING ─────────────────────────────────────────────
  const FILTER_MAP: Record = {
    all:      ['pending','accepted','arriving','checked_in',
               'paused','completed','cancelled','declined'],
    active:   ['arriving','checked_in','paused'],
    archived: ['completed','cancelled','declined'],
  }
  Note: 'unread' filter is handled separately (see STEP 4).

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions     alias: cs
    id, elder_id, caregiver_id, care_type, status, scheduled_at

  TABLE caregivers        alias: cg
    id, user_id

  TABLE users             alias: cu  (caregiver)
    id, name

  TABLE elders            alias: e
    id, user_id

  TABLE users             alias: eu  (elder)
    id, name

  TABLE messages          alias: m
    id, session_id, sender_user_id, content, is_read, created_at

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse filter + search params

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — const elderIds = await getRelativeElderIds(user.id)
             If empty → return { conversations: [], totalUnread: 0 }

  STEP 4 — Build and execute query using CTE:

    WITH last_msgs AS (
      SELECT DISTINCT ON (session_id)
        session_id,
        content      AS last_message,
        created_at   AS last_message_at
      FROM messages
      ORDER BY session_id, created_at DESC
    ),
    unread_counts AS (
      SELECT
        session_id,
        COUNT(*)::INT AS unread_count
      FROM messages
      WHERE sender_user_id != ${user.id}
        AND is_read = false
      GROUP BY session_id
    )
    SELECT
      cs.id         AS session_id,
      cs.care_type,
      cs.status,
      cs.scheduled_at,
      cu.name       AS caregiver_name,
      eu.name       AS elder_name,
      lm.last_message,
      lm.last_message_at,
      COALESCE(uc.unread_count, 0)::INT AS unread_count
    FROM   care_sessions cs
    JOIN   caregivers cg ON cs.caregiver_id = cg.id
    JOIN   users      cu ON cg.user_id      = cu.id
    JOIN   elders     e  ON cs.elder_id     = e.id
    JOIN   users      eu ON e.user_id       = eu.id
    LEFT JOIN last_msgs     lm ON lm.session_id = cs.id
    LEFT JOIN unread_counts uc ON uc.session_id = cs.id
    WHERE  cs.elder_id = ANY(${elderIds}::int[])
      [AND cs.status = ANY(${statusFilter}) if filter != 'unread']
      [AND uc.unread_count > 0 if filter == 'unread']
      [AND (cu.name ILIKE search OR eu.name ILIKE search) if search]
    ORDER BY COALESCE(lm.last_message_at, cs.created_at) DESC

  STEP 5 — Compute totalUnread
    = rows.reduce((sum, c) => sum + c.unread_count, 0)

  STEP 6 — Return 200:
    {
      success: true,
      data: {
        conversations: Array,
        totalUnread: number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - 'unread' filter cannot use FILTER_MAP — must filter via CTE unread_count
  - totalUnread computed from result array, NOT a separate COUNT query
  - Use DISTINCT ON for last_msg — more efficient than MAX subquery
  - Only sessions belonging to relative's elders appear — enforced by
    cs.elder_id = ANY(elderIds)
*/
