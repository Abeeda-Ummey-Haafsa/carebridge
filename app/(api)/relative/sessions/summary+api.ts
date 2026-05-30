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
      return Response.json({
        success: true,
        data: { total: 0, active: 0, upcoming: 0, completed: 0, cancelled: 0 },
      });
    }

    const rows = await db<{
      total: number;
      active: number;
      upcoming: number;
      completed: number;
      cancelled: number;
    }>`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status IN ('arriving','checked_in','paused'))::INT AS active,
        COUNT(*) FILTER (WHERE status IN ('pending','accepted') AND scheduled_at > NOW())::INT AS upcoming,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed,
        COUNT(*) FILTER (WHERE status IN ('declined','cancelled'))::INT AS cancelled
      FROM care_sessions
      WHERE elder_id = ANY(${elderIds}::int[])
    `;

    const r = rows?.[0] ?? {
      total: 0,
      active: 0,
      upcoming: 0,
      completed: 0,
      cancelled: 0,
    };

    return Response.json({ success: true, data: r });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/sessions/summary] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions/summary+api.ts
  PURPOSE: GET /api/relative/sessions/summary
           Single-query aggregated session counts for the Sessions screen
           header pills (Section 1). Powers the active/upcoming/
           completed/cancelled summary indicators.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — const elderIds = await getRelativeElderIds(user.id)
             If empty → return all zeros.

  STEP 3 — Single aggregation query
    SELECT
      COUNT(*)::INT                                           AS total,
      COUNT(*) FILTER (
        WHERE status IN ('arriving','checked_in','paused')
      )::INT                                                  AS active,
      COUNT(*) FILTER (
        WHERE status IN ('pending','accepted') AND scheduled_at > NOW()
      )::INT                                                  AS upcoming,
      COUNT(*) FILTER (
        WHERE status = 'completed'
      )::INT                                                  AS completed,
      COUNT(*) FILTER (
        WHERE status IN ('declined','cancelled')
      )::INT                                                  AS cancelled
    FROM   care_sessions
    WHERE  elder_id = ANY(${elderIds}::int[])

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        total:     number,
        active:    number,
        upcoming:  number,
        completed: number,
        cancelled: number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Use COUNT + FILTER — NOT multiple queries or subqueries
  - All Neon COUNT values cast with ::INT in SQL
  - If elderIds empty, skip DB query and return all zeros immediately
*/
