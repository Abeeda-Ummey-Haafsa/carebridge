import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

interface LocationUpdateBody {
  lat: number;
  lng: number;
  session_id?: number;
}

// TODO: For multi-instance deployments, this in-memory Map should be replaced with Redis.
const lastUpdateMap = new Map<number, number>();

export async function PATCH(request: Request): Promise<Response> {
  try {
    // Step 1: Parse + validate body
    const body: Partial<LocationUpdateBody> = await request
      .json()
      .catch(() => ({}));

    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number" ||
      body.lat < -90 ||
      body.lat > 90 ||
      body.lng < -180 ||
      body.lng > 180
    ) {
      return Response.json(
        { error: "Valid lat and lng are required" },
        { status: 400 },
      );
    }

    // Step 2: Authenticate caregiver
    const { caregiver } = await requireCaregiver(request);

    // Step 3: Rate limit check (Max 1 write per 10s per caregiver)
    const lastUpdate = lastUpdateMap.get(caregiver.id) ?? 0;
    const now = Date.now();
    if (now - lastUpdate < 10_000) {
      return Response.json(
        { error: "Rate limit: location updates allowed once per 10 seconds" },
        { status: 429 },
      );
    }
    lastUpdateMap.set(caregiver.id, now);

    // Step 4: UPDATE caregivers
    const updatedRows = await db<any>`
      UPDATE caregivers
      SET current_lat = ${body.lat},
          current_lng = ${body.lng}
      WHERE id = ${caregiver.id}
      RETURNING id, current_lat, current_lng
    `;

    if (updatedRows.length === 0) {
      return Response.json(
        { error: "Failed to update location" },
        { status: 500 },
      );
    }

    // Step 5: REALTIME BROADCAST (fire-and-forget, try/catch)
    (async () => {
      try {
        const channelName = body.session_id
          ? `session:${body.session_id}`
          : "caregivers:location";
        const eventName = body.session_id
          ? "caregiver_location_updated"
          : "location_updated";

        await supabase.channel(channelName).send({
          type: "broadcast",
          event: eventName,
          payload: {
            caregiver_id: caregiver.id,
            lat: body.lat,
            lng: body.lng,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (broadcastErr) {
        console.error("[location PATCH] Broadcast error:", broadcastErr);
      }
    })();

    // Step 6: Return 200
    return Response.json(
      {
        success: true,
        data: {
          lat: body.lat,
          lng: body.lng,
          updated_at: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[location PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
