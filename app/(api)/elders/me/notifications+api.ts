import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireElder(request);

    // Parse query params
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread_only") === "true";

    const rows = await db<any>`
      SELECT 
        id, title, body, type, is_read, 
        created_at, related_id, related_type
      FROM notifications
      WHERE user_id = ${user.id}
        AND (${unreadOnly}::boolean = false OR is_read = false)
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({
      success: true,
      data: rows,
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/notifications GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireElder(request);

    // Using query param for ID since Expo Router params map poorly on standard base nested routes
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id || isNaN(parseInt(id, 10))) {
      return Response.json(
        { error: "Valid Notification ID param is required" },
        { status: 400 },
      );
    }

    const rows = await db<any>`
      UPDATE notifications
      SET is_read = true
      WHERE id = ${parseInt(id, 10)}
        AND user_id = ${user.id}
      RETURNING id, is_read
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: rows[0],
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/notifications PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
