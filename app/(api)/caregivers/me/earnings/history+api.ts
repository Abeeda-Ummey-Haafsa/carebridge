import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const url = new URL(request.url);
    const cursorStr = url.searchParams.get("cursor");
    const limitStr = url.searchParams.get("limit");

    let limit = limitStr ? parseInt(limitStr, 10) : 20;
    if (isNaN(limit) || limit <= 0) limit = 20;
    if (limit > 50) limit = 50;

    let cursor = cursorStr ? parseInt(cursorStr, 10) : null;
    if (cursor !== null && isNaN(cursor)) cursor = null;

    // Parallel fetch the payout paginated feed AND the summation metadata.
    const [rows, pendingRows] = await Promise.all([
      db<any>`
        SELECT
          cs.id, cs.care_type, cs.scheduled_at,
          cs.actual_duration_minutes, cs.total_cost,
          cs.status, cs.checked_out_at,
          u.name AS elder_name,
          p.status AS payment_status, p.paid_at
        FROM care_sessions cs
        JOIN elders e ON cs.elder_id = e.id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN payments p ON p.session_id = cs.id
        WHERE cs.caregiver_id = ${caregiver.id}
          AND cs.status = 'completed'
          AND (${cursor === null}::boolean OR cs.id < ${cursor ?? 0})
        ORDER BY cs.scheduled_at DESC
        LIMIT ${limit + 1}
      `,
      db<any>`
        SELECT COALESCE(SUM(cs.total_cost), 0)::FLOAT AS pending_total
        FROM care_sessions cs
        LEFT JOIN payments p ON p.session_id = cs.id
        WHERE cs.caregiver_id = ${caregiver.id}
          AND cs.status = 'completed'
          AND (p.id IS NULL OR p.status != 'succeeded')
      `,
    ]);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

    const pendingPayout = pendingRows[0]?.pending_total || 0;

    return Response.json({
      success: true,
      data: {
        history: data,
        pending_payout: pendingPayout,
        pagination: {
          has_more: hasMore,
          next_cursor: nextCursor,
          limit,
        },
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[caregivers/me/earnings/history GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
