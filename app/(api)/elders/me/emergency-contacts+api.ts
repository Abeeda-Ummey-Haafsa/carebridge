import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    const rows = await db<any>`
      SELECT id, name, phone, relationship, is_primary
      FROM elder_emergency_contacts
      WHERE elder_id = ${elder.id}
      ORDER BY is_primary DESC, id ASC
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
    console.error("[elders/me/emergency-contacts GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
