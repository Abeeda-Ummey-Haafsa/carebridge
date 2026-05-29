import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

// Simple in-memory cache to reduce repeated fetches on pull-to-refresh
const scheduleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    // Parse date query param, defaulting to today
    const url = new URL(request.url);
    const dateParam = url.searchParams.get("date");

    let targetDate = new Date();
    if (dateParam && !isNaN(Date.parse(dateParam))) {
      targetDate = new Date(dateParam);
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    // Check cache
    const cacheKey = `${caregiver.id}_${dateStr}`;
    const cached = scheduleCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return Response.json(
        { success: true, data: cached.data, cached: true },
        {
          status: 200,
          headers: { "Cache-Control": "private, max-age=60" },
        },
      );
    }

    const rows = await db<any>`
      SELECT 
        cs.id, 
        cs.status, 
        cs.care_type, 
        cs.scheduled_at, 
        cs.duration_minutes, 
        cs.checked_in_at, 
        cs.checked_out_at, 
        cs.actual_duration_minutes,
        u.name as elder_name
      FROM care_sessions cs
      JOIN elders e ON cs.elder_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE cs.caregiver_id = ${caregiver.id}
      AND cs.scheduled_at::date = ${dateStr}::date
      AND cs.status IN ('accepted', 'arriving', 'checked_in', 'paused', 'completed')
      ORDER BY cs.scheduled_at ASC
    `;

    // Process rows to attach start/end time representations
    const processedRows = rows.map((row) => {
      let estimated_end_time = null;
      if (row.scheduled_at) {
        const start = new Date(row.scheduled_at).getTime();
        estimated_end_time = new Date(
          start + row.duration_minutes * 60000,
        ).toISOString();
      }

      return {
        ...row,
        estimated_end_time,
      };
    });

    // Update cache
    scheduleCache.set(cacheKey, { data: processedRows, timestamp: now });

    // Optional: We can garbage collect old cache keys if size gets too big
    if (scheduleCache.size > 1000) {
      scheduleCache.clear();
    }

    return Response.json(
      { success: true, data: processedRows, cached: false },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=60" },
      },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[schedule+api GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
