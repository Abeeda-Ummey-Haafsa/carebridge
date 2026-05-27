import { getAuthenticatedUser, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { User } from "@/types/db";

export async function PATCH(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const rows = await db<User>`
      UPDATE users
      SET name = ${body.name.trim()}
      WHERE id = ${user.id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[users/me+api PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
