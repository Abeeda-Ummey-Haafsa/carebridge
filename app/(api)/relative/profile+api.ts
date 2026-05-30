import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const rows = await db<{
      id: number;
      name: string;
      email: string;
      created_at: string;
    }>`
      SELECT id, name, email, created_at
      FROM   users
      WHERE  id = ${user.id}
      LIMIT  1
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Relative profile not found" },
        { status: 404 },
      );
    }

    const profile = rows[0];

    return Response.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        memberSince: new Date(profile.created_at).toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[relative/profile GET]", error);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
