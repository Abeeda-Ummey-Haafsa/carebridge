import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    const rows = await db<any>`
      SELECT 
        u.id AS user_id, 
        u.name, 
        u.email, 
        link.relationship, 
        link.is_primary
      FROM elder_relative_links link
      JOIN users u ON link.relative_user_id = u.id
      WHERE link.elder_id = ${elder.id}
      ORDER BY link.is_primary DESC, link.created_at ASC
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
    console.error("[elders/me/relatives GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
