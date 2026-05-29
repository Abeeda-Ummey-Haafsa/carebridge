import { requireElder, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { elder } = await requireElder(request);

    // 1. Get active session ID and caregiver details mapped down
    const sessionRows = await db<any>`
      SELECT 
        cs.id AS session_id,
        cs.care_type,
        cs.status,
        cs.scheduled_at,
        cs.checked_in_at,
        cg.id AS caregiver_id,
        cg.current_lat,
        cg.current_lng,
        u.name AS caregiver_name
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users u ON cg.user_id = u.id
      WHERE cs.elder_id = ${elder.id}
        AND cs.status IN ('arriving', 'checked_in', 'paused')
      ORDER BY cs.scheduled_at DESC
      LIMIT 1
    `;

    if (sessionRows.length === 0) {
      return Response.json({ success: true, data: null });
    }

    const session = sessionRows[0];

    // Default straight line distance calculator using Haversine
    let distance_km = 0;
    let eta_minutes = 0;

    if (
      session.current_lat &&
      session.current_lng &&
      elder.home_lat &&
      elder.home_lng
    ) {
      const R = 6371; // km
      const dLat = ((elder.home_lat - session.current_lat) * Math.PI) / 180;
      const dLon = ((elder.home_lng - session.current_lng) * Math.PI) / 180;
      const lat1 = (session.current_lat * Math.PI) / 180;
      const lat2 = (elder.home_lat * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) *
          Math.sin(dLon / 2) *
          Math.cos(lat1) *
          Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distance_km = R * c;

      // Rough car estimate fallback: 30 km/h avg city speed
      eta_minutes = Math.round((distance_km / 30) * 60);
    }

    return Response.json({
      success: true,
      data: {
        caregiver_id: session.caregiver_id,
        caregiver_name: session.caregiver_name,
        care_type: session.care_type,
        status: session.status,
        scheduled_at: session.scheduled_at,
        checked_in_at: session.checked_in_at,
        current_lat: session.current_lat,
        current_lng: session.current_lng,
        distance_km: distance_km,
        eta_minutes: eta_minutes,
      },
    });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[elders/me/active-session/caregiver GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
