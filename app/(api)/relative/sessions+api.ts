import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

const STATUS_MAP: Record<string, string[]> = {
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
  upcoming: ["pending", "accepted"],
  active: ["arriving", "checked_in", "paused"],
  completed: ["completed"],
  cancelled: ["declined", "cancelled"],
};

const SORT_MAP: Record<string, string> = {
  newest_first: "cs.scheduled_at DESC",
  oldest_first: "cs.scheduled_at ASC",
  highest_payment: "cs.total_cost DESC NULLS LAST",
  upcoming_first: "cs.scheduled_at ASC",
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const statusParam = String(url.searchParams.get("status") ?? "all");
    const searchParam = String(url.searchParams.get("search") ?? "").trim();
    const sortParam = String(url.searchParams.get("sort") ?? "newest_first");
    const page = Math.max(
      1,
      parseInt(String(url.searchParams.get("page") ?? "1"), 10) || 1,
    );
    const limit = Math.min(
      parseInt(String(url.searchParams.get("limit") ?? "20"), 10) || 20,
      50,
    );
    const offset = (page - 1) * limit;

    const statuses = STATUS_MAP[statusParam] ?? STATUS_MAP.all;
    const orderBy = SORT_MAP[sortParam] ?? SORT_MAP.newest_first;

    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);
    if (!elderIds || elderIds.length === 0) {
      return Response.json({
        success: true,
        data: {
          sessions: [],
          pagination: { total: 0, page, limit, hasMore: false },
        },
      });
    }

    const searchWildcard = searchParam ? `%${searchParam}%` : null;

    const mainQuery = db<any>`
      WITH recent_notes AS (
        SELECT DISTINCT ON (session_id)
          session_id,
          SUBSTRING(content, 1, 80) AS notes_preview
        FROM session_notes
        ORDER BY session_id, created_at DESC
      )
      SELECT
        cs.id, cs.care_type, cs.status, cs.scheduled_at,
        cs.duration_minutes, cs.checked_in_at, cs.checked_out_at,
        cs.total_cost, cs.elder_address, cs.created_at,
        cu.name AS caregiver_name,
        cg.avg_rating AS caregiver_rating,
        eu.name AS elder_name,
        rn.notes_preview
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users cu ON cg.user_id = cu.id
      JOIN elders e ON cs.elder_id = e.id
      JOIN users eu ON e.user_id = eu.id
      LEFT JOIN recent_notes rn ON rn.session_id = cs.id
      WHERE cs.elder_id = ANY(${elderIds}::int[])
        AND cs.status = ANY(${statuses}::varchar[])
        AND (${searchWildcard} IS NULL OR (cu.name ILIKE ${searchWildcard} OR eu.name ILIKE ${searchWildcard} OR cs.care_type ILIKE ${searchWildcard}))
      ORDER BY ${orderBy}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const countQuery = db<{ total: number }>`
      SELECT COUNT(*)::INT AS total
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users cu ON cg.user_id = cu.id
      JOIN elders e ON cs.elder_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE cs.elder_id = ANY(${elderIds}::int[])
        AND cs.status = ANY(${statuses}::varchar[])
        AND (${searchWildcard} IS NULL OR (cu.name ILIKE ${searchWildcard} OR eu.name ILIKE ${searchWildcard} OR cs.care_type ILIKE ${searchWildcard}))
    `;

    const [rows, countRows] = await Promise.all([mainQuery, countQuery]);

    const total = countRows?.[0]?.total ?? 0;

    return Response.json({
      success: true,
      data: {
        sessions: (rows || []).map((r: any) => ({
          id: r.id,
          careType: r.care_type,
          status: r.status,
          scheduledAt: r.scheduled_at,
          durationMinutes: r.duration_minutes,
          checkedInAt: r.checked_in_at,
          checkedOutAt: r.checked_out_at,
          totalCost: r.total_cost,
          elderAddress: r.elder_address,
          createdAt: r.created_at,
          caregiverName: r.caregiver_name,
          caregiverRating: r.caregiver_rating,
          elderName: r.elder_name,
          notesPreview: r.notes_preview ?? null,
        })),
        pagination: {
          total,
          page,
          limit,
          hasMore: offset + (rows?.length ?? 0) < total,
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
    console.error("[relative/sessions] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions+api.ts
  PURPOSE: GET /api/relative/sessions
           Paginated, filterable, searchable list of all sessions for
           the relative's linked elders. Powers the Session Timeline
           (Sections 3–6) in the Sessions screen.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  status: 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'
          Default: 'all'
  search: string — ILIKE match on caregiver name, elder name, care type
  sort:   'newest_first' | 'oldest_first' | 'highest_payment' | 'upcoming_first'
          Default: 'newest_first'
  page:   string (default '1')
  limit:  string (default '20', max 50)

  ── STATUS → DB STATUSES MAPPING ─────────────────────────────────────────
  const STATUS_MAP: Record = {
    all:       ['pending','accepted','arriving','checked_in',
                'paused','completed','cancelled','declined'],
    upcoming:  ['pending','accepted'],
    active:    ['arriving','checked_in','paused'],
    completed: ['completed'],
    cancelled: ['declined','cancelled'],
  }

  ── SORT ORDER MAP ────────────────────────────────────────────────────────
  const SORT_MAP = {
    newest_first:    'cs.scheduled_at DESC',
    oldest_first:    'cs.scheduled_at ASC',
    highest_payment: 'cs.total_cost DESC NULLS LAST',
    upcoming_first:  'cs.scheduled_at ASC',
  }

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions   alias: cs
    id, elder_id, caregiver_id, care_type, status, scheduled_at,
    duration_minutes, checked_in_at, checked_out_at, total_cost,
    elder_address, created_at

  TABLE caregivers      alias: cg
    id, user_id, avg_rating

  TABLE users           alias: cu  (caregiver)
    id, name

  TABLE elders          alias: e
    id, user_id

  TABLE users           alias: eu  (elder)
    id, name

  TABLE session_notes   alias: sn  (LEFT JOIN for notes_preview)
    session_id, content, created_at

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse all query params with safe defaults
    page   = Math.max(1, parseInt(pageParam ?? '1'))
    limit  = Math.min(parseInt(limitParam ?? '20'), 50)
    offset = (page - 1) * limit
    statuses = STATUS_MAP[statusParam ?? 'all'] ?? STATUS_MAP.all
    orderBy  = SORT_MAP[sortParam ?? 'newest_first'] ?? SORT_MAP.newest_first

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — const elderIds = await getRelativeElderIds(user.id)
             If empty → return empty list.

  STEP 4 — Build WHERE conditions array. Base condition always:
      cs.elder_id = ANY(${elderIds}::int[])
      AND cs.status = ANY(${statuses}::varchar[])

    If search provided (trimmed, non-empty):
      AND (cu.name ILIKE ${'%' + search + '%'}
       OR  eu.name ILIKE ${'%' + search + '%'}
       OR  cs.care_type ILIKE ${'%' + search + '%'})

  STEP 5 — Execute main query with DISTINCT ON for notes_preview
    Use a CTE to get the most recent note per session:

    WITH recent_notes AS (
      SELECT DISTINCT ON (session_id)
        session_id,
        SUBSTRING(content, 1, 80) AS notes_preview
      FROM session_notes
      ORDER BY session_id, created_at DESC
    )
    SELECT
      cs.id, cs.care_type, cs.status, cs.scheduled_at,
      cs.duration_minutes, cs.checked_in_at, cs.checked_out_at,
      cs.total_cost, cs.elder_address, cs.created_at,
      cu.name   AS caregiver_name,
      cg.avg_rating AS caregiver_rating,
      eu.name   AS elder_name,
      rn.notes_preview
    FROM   care_sessions cs
    JOIN   caregivers    cg ON cs.caregiver_id = cg.id
    JOIN   users         cu ON cg.user_id      = cu.id
    JOIN   elders        e  ON cs.elder_id     = e.id
    JOIN   users         eu ON e.user_id       = eu.id
    LEFT JOIN recent_notes rn ON rn.session_id = cs.id
    WHERE  [dynamic conditions]
    ORDER  BY [orderBy expression]
    LIMIT  ${limit}
    OFFSET ${offset}

  STEP 6 — COUNT query (parallel with STEP 5)
    SELECT COUNT(*)::INT AS total
    FROM   care_sessions cs
    JOIN   users cu ON (JOIN caregivers cg ...) ...
    WHERE  [same dynamic conditions as STEP 5]

  STEP 7 — Return 200:
    {
      success: true,
      data: {
        sessions: Array,
        pagination: {
          total:   number,
          page:    number,
          limit:   number,
          hasMore: boolean,
        },
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Use STATUS_MAP as the single source of truth for status groups
  - SORT_MAP is the single source of truth for order-by expressions
  - Run main query and COUNT query in parallel via Promise.all()
  - ILIKE search is safe in parameterized queries — no regex injection risk
  - notes_preview must be max 80 characters (SUBSTRING in CTE)
  - Do NOT expose elder home_lat/lng in list view
*/
