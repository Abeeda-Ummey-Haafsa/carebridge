import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

if (!process.env.GOOGLE_DIRECTIONS_API_KEY) {
  throw new Error("GOOGLE_DIRECTIONS_API_KEY is not set");
}

// TODO: Replace process-level cache with Redis in production.
type EtaCache = {
  duration_seconds: number;
  distance_meters: number;
  polyline_points: string;
  cached_at: number;
};
const etaCache = new Map<number, EtaCache>();

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse sessionId
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver } = await requireCaregiver(request);

    // Step 3: Check cache (TTL 30 seconds)
    const cached = etaCache.get(sessionId);
    if (cached && Date.now() - cached.cached_at < 30_000) {
      const durationMins = Math.round(cached.duration_seconds / 60);
      const distanceKm = (cached.distance_meters / 1000).toFixed(1);

      return Response.json(
        {
          success: true,
          data: {
            duration_seconds: cached.duration_seconds,
            duration_text: `${durationMins} mins`,
            distance_meters: cached.distance_meters,
            distance_text: `${distanceKm} km`,
            polyline_points: cached.polyline_points,
            from_cache: true,
            cache_age_seconds: Math.round(
              (Date.now() - cached.cached_at) / 1000,
            ),
          },
        },
        { status: 200 },
      );
    }

    // Step 4: Fetch session + caregiver coords
    const rows = await db<any>`
      SELECT cs.elder_lat, cs.elder_lng, cs.caregiver_id,
             cg.current_lat AS caregiver_lat,
             cg.current_lng AS caregiver_lng
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      WHERE cs.id = ${sessionId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = rows[0];

    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 5: Coord availability check
    if (
      session.caregiver_lat === null ||
      session.caregiver_lng === null ||
      session.elder_lat === null ||
      session.elder_lng === null
    ) {
      return Response.json(
        { error: "Location data unavailable for one or both parties" },
        { status: 422 },
      );
    }

    const cgLat = Number(session.caregiver_lat);
    const cgLng = Number(session.caregiver_lng);
    const eLat = Number(session.elder_lat);
    const eLng = Number(session.elder_lng);

    // Step 6: Call Google Directions API
    // TODO: Replace with Google Routes API (successor) when ready.
    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.append("origin", `${cgLat},${cgLng}`);
    url.searchParams.append("destination", `${eLat},${eLng}`);
    url.searchParams.append("departure_time", "now");
    url.searchParams.append("traffic_model", "best_guess");
    url.searchParams.append("key", process.env.GOOGLE_DIRECTIONS_API_KEY!);

    const googleRes = await fetch(url.toString());
    const googleData = await googleRes.json();

    if (googleData.status !== "OK") {
      console.error("[eta GET] Google API error:", googleData.status);
      return Response.json(
        { error: "Could not compute route at this time" },
        { status: 502 },
      );
    }

    const leg = googleData.routes[0].legs[0];
    const durationSeconds =
      leg.duration_in_traffic?.value ?? leg.duration.value;
    const distanceMeters = leg.distance.value;
    const polylinePoints = googleData.routes[0].overview_polyline.points;

    // Step 7: Store in cache
    etaCache.set(sessionId, {
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      polyline_points: polylinePoints,
      cached_at: Date.now(),
    });

    // Step 8: Return 200
    const durationMins = Math.round(durationSeconds / 60);
    const distanceKm = (distanceMeters / 1000).toFixed(1);

    return Response.json(
      {
        success: true,
        data: {
          duration_seconds: durationSeconds,
          duration_text: `${durationMins} mins`,
          distance_meters: distanceMeters,
          distance_text: `${distanceKm} km`,
          polyline_points: polylinePoints,
          origin: {
            lat: cgLat,
            lng: cgLng,
          },
          destination: {
            lat: eLat,
            lng: eLng,
          },
          from_cache: false,
          cache_age_seconds: 0,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[eta GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
