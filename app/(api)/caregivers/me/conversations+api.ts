import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
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
  ],
  active: ["arriving", "checked_in", "paused"],
  unread: [], // handled separately via unread_count CTE
  archived: ["completed", "cancelled", "declined"],
};

interface ConversationEntry {
  session_id: number;
  care_type: string;
  status: string;
  scheduled_at: string;
  relative_name: string;
  elder_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: ConversationEntry[];
    total_unread: number;
  };
}

export async function GET(request: Request): Promise<Response> {
  try {
    // Step 1: Parse query params
    const url = new URL(request.url);
    const filterParam = url.searchParams.get("filter") || "all";
    const searchParam = url.searchParams.get("search");

    const filter = Object.keys(FILTER_MAP).includes(filterParam)
      ? filterParam
      : "all";
    const isUnreadFilter = filter === "unread";
    const statuses = isUnreadFilter ? [] : FILTER_MAP[filter];
    const searchPattern = searchParam ? `%${searchParam}%` : null;

    // Step 2: Authenticate caregiver
    const { caregiver, user } = await requireCaregiver(request);

    // Step 3: Build and run the conversation list query
    const rows = await db<any>`
      WITH last_msgs AS (
        SELECT DISTINCT ON (session_id)
          session_id,
          content AS last_message,
          created_at AS last_message_at,
          sender_user_id
        FROM messages
        ORDER BY session_id, created_at DESC
      ),
      unread_counts AS (
        SELECT
          session_id,
          COUNT(*) AS unread_count
        FROM messages
        WHERE is_read = false
          AND sender_user_id != ${user.id}
        GROUP BY session_id
      )
      SELECT
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cs.updated_at,
        ru.name AS relative_name,
        eu.name AS elder_name,
        lm.last_message,
        lm.last_message_at,
        COALESCE(uc.unread_count, 0)::INT AS unread_count
      FROM care_sessions cs
      JOIN users ru ON cs.booked_by_user_id = ru.id
      JOIN elders e ON cs.elder_id = e.id
      JOIN users eu ON e.user_id = eu.id
      LEFT JOIN last_msgs lm ON lm.session_id = cs.id
      LEFT JOIN unread_counts uc ON uc.session_id = cs.id
      WHERE cs.caregiver_id = ${caregiver.id}
        AND (
          ${isUnreadFilter}::boolean = true AND COALESCE(uc.unread_count, 0) > 0
          OR 
          ${isUnreadFilter}::boolean = false AND cs.status = ANY(${statuses}::varchar[])
        )
        AND (
          ${searchPattern}::text IS NULL
          OR ru.name ILIKE ${searchPattern}
          OR eu.name ILIKE ${searchPattern}
        )
      ORDER BY COALESCE(lm.last_message_at, cs.created_at) DESC
    `;

    // Map rows and compute total unread
    const conversations: ConversationEntry[] = rows.map((row) => ({
      session_id: row.session_id,
      care_type: row.care_type,
      status: row.status,
      scheduled_at: row.scheduled_at,
      relative_name: row.relative_name,
      elder_name: row.elder_name,
      last_message: row.last_message ?? null,
      last_message_at: row.last_message_at ?? null,
      unread_count: Number(row.unread_count),
    }));

    const totalUnread = conversations.reduce(
      (sum, conv) => sum + conv.unread_count,
      0,
    );

    // Step 4: Return 200
    const responsePayload: ConversationsResponse = {
      success: true,
      data: {
        conversations,
        total_unread: totalUnread,
      },
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[conversations GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
