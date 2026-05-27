import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const statusParam = url.searchParams.get("status");
    const searchParam = url.searchParams.get("search");
    const sortParam = url.searchParams.get("sort") || "newest";
    const cursorParam = url.searchParams.get("cursor");
    const limitParam = url.searchParams.get("limit");

    let limit = Math.min(parseInt(limitParam ?? "20", 10), 50);
    if (isNaN(limit) || limit < 1) limit = 20;

    let cursor = cursorParam ? parseInt(cursorParam, 10) : null;
    if (cursor !== null && isNaN(cursor)) cursor = null;

    let statusArray: string[] | null = null;
    if (statusParam === "upcoming") {
      statusArray = ["pending", "accepted", "arriving"];
    } else if (statusParam === "active") {
      statusArray = ["checked_in", "paused"];
    } else if (statusParam === "completed") {
      statusArray = ["completed"];
    } else if (statusParam === "cancelled") {
      statusArray = ["declined", "cancelled"];
    }

    let searchStr: string | null = null;
    if (searchParam && searchParam.trim().length > 0) {
      searchStr = `%${searchParam.trim()}%`;
    }

    const { caregiver } = await requireCaregiver(request);

    // Using fully parameterised queries with boolean switches
    // rather than string injection for SQL safety.
    const rows = await db<any>`
      SELECT
        cs.id, cs.care_type, cs.status, cs.scheduled_at,
        cs.duration_minutes, cs.hourly_rate, cs.total_cost,
        cs.checked_in_at, cs.checked_out_at,
        cs.actual_duration_minutes, cs.elder_address,
        cs.created_at,
        u.name AS elder_name,
        e.id   AS elder_profile_id
      FROM care_sessions cs
      JOIN elders e ON cs.elder_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE cs.caregiver_id = ${caregiver.id}
        AND (${statusArray === null}::boolean OR cs.status = ANY(${statusArray ?? []}::varchar[]))
        AND (${searchStr === null}::boolean OR u.name ILIKE ${searchStr ?? ""}::varchar)
        AND (${cursor === null}::boolean OR (
          CASE 
            WHEN ${sortParam}::varchar = 'oldest' THEN cs.id > ${cursor ?? 0}
            ELSE cs.id < ${cursor ?? 0}
          END
        ))
      ORDER BY
        CASE WHEN ${sortParam}::varchar = 'newest' THEN cs.scheduled_at END DESC,
        CASE WHEN ${sortParam}::varchar = 'oldest' THEN cs.scheduled_at END ASC,
        CASE WHEN ${sortParam}::varchar = 'highest_earnings' THEN cs.total_cost END DESC NULLS LAST,
        CASE WHEN ${sortParam}::varchar = 'longest' THEN cs.actual_duration_minutes END DESC NULLS LAST,
        cs.id DESC
      LIMIT ${limit + 1}
    `;

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

    return Response.json({
      success: true,
      data: {
        sessions: data,
        pagination: {
          has_more: hasMore,
          next_cursor: nextCursor,
          limit,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET sessions error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
