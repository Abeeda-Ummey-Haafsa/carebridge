import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user, elder } = await requireElder(request);

    const rows = await db<any>`
      SELECT 
        u.id AS user_id, u.name, u.email,
        e.id AS elder_id, e.date_of_birth, e.mobility_level,
        e.preferred_languages, e.medical_notes, e.allergies,
        e.home_address, e.home_lat, e.home_lng
      FROM users u
      JOIN elders e ON u.id = e.user_id
      WHERE u.id = ${user.id}
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Elder profile not found" },
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
    console.error("[elders/me GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, elder } = await requireElder(request);
    const body = await request.json().catch(() => ({}));

    // Explicitly destructure only allowed fields
    const { home_address, home_lat, home_lng, preferred_languages } = body;

    // Validate lat/lng
    let lat: number | null = null;
    let lng: number | null = null;
    if (home_lat !== undefined && home_lat !== null) {
      lat = parseFloat(home_lat);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return Response.json({ error: "Invalid latitude" }, { status: 400 });
      }
    }

    if (home_lng !== undefined && home_lng !== null) {
      lng = parseFloat(home_lng);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return Response.json({ error: "Invalid longitude" }, { status: 400 });
      }
    }

    const updatedRows = await db<any>`
      UPDATE elders
      SET 
        home_address = COALESCE(${home_address === undefined ? null : home_address}, home_address),
        home_lat = COALESCE(${lat}, home_lat),
        home_lng = COALESCE(${lng}, home_lng),
        preferred_languages = COALESCE(${preferred_languages === undefined ? null : preferred_languages}::text[], preferred_languages)
      WHERE id = ${elder.id}
      RETURNING *
    `;

    return Response.json({
      success: true,
      data: updatedRows[0],
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
