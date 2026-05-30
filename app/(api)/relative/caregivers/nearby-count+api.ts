import {
  ApiAuthError,
  getRelativeElderIds,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);
    const elderIds = await getRelativeElderIds(user.id);

    if (elderIds.length === 0) {
      return Response.json({
        success: true,
        data: { availableCount: 0, radiusKm: 20 },
      });
    }

    const searchParams = new URL(request.url).searchParams;
    const elderIdParam = searchParams.get("elder_id");

    let elderId: number | null = null;

    if (elderIdParam !== null) {
      elderId = Number.parseInt(elderIdParam, 10);

      if (Number.isNaN(elderId)) {
        return Response.json({ error: "Invalid elder_id" }, { status: 400 });
      }

      await requireRelativeOwnership(user.id, elderId);
    }

    const elderRows =
      elderId !== null
        ? await db<{ home_lat: number | null; home_lng: number | null }>`
          SELECT home_lat, home_lng
          FROM   elders
          WHERE  id = ${elderId}
          LIMIT  1
        `
        : await db<{ home_lat: number | null; home_lng: number | null }>`
          SELECT e.home_lat, e.home_lng
          FROM   elders e
          JOIN   elder_relative_links erl ON e.id = erl.elder_id
          WHERE  erl.relative_user_id = ${user.id}
            AND  erl.is_primary = true
          LIMIT  1
        `;

    if (
      elderRows.length === 0 ||
      elderRows[0].home_lat === null ||
      elderRows[0].home_lng === null
    ) {
      return Response.json(
        { error: "Elder home coordinates not set" },
        { status: 422 },
      );
    }

    const elderLat = elderRows[0].home_lat;
    const elderLng = elderRows[0].home_lng;

    const [countRows, radiusRows] = await Promise.all([
      db<{ available_count: number }>`
        SELECT COUNT(*)::INT AS available_count
        FROM   caregivers cg
        WHERE  cg.is_available = true
          AND  cg.current_lat IS NOT NULL
          AND  cg.current_lng IS NOT NULL
          AND  (
            6371 * ACOS(
              LEAST(1.0,
                COS(RADIANS(${elderLat}::float)) *
                COS(RADIANS(cg.current_lat::float)) *
                COS(RADIANS(cg.current_lng::float) - RADIANS(${elderLng}::float)) +
                SIN(RADIANS(${elderLat}::float)) *
                SIN(RADIANS(cg.current_lat::float))
              )
            )
          ) <= cg.service_radius_km
      `,
      db<{ radius_km: number }>`
        SELECT COALESCE(MAX(service_radius_km), 20)::INT AS radius_km
        FROM   caregivers
        WHERE  is_available = true
      `,
    ]);

    return Response.json({
      success: true,
      data: {
        availableCount: countRows[0]?.available_count ?? 0,
        radiusKm: radiusRows[0]?.radius_km ?? 20,
      },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
