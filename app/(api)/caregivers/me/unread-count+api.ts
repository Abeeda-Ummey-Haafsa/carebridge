import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { caregiver, user } = await requireCaregiver(request);

    const result = await db<any>`
      SELECT COUNT(m.id)::INT AS unread_count
      FROM messages m
      JOIN care_sessions cs ON m.session_id = cs.id
      WHERE cs.caregiver_id = ${caregiver.id}
        AND m.sender_user_id != ${user.id}
        AND m.is_read = false
    `;

    const unreadCount = result[0]?.unread_count || 0;

    return Response.json({
      success: true,
      data: {
        unread_count: unreadCount,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET unread-count error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
