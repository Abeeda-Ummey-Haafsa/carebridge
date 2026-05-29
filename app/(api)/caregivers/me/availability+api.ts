import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db, sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";

interface AvailabilityToggleResponse {
  success: boolean;
  data: {
    caregiver_id: number;
    is_available: boolean;
    updated_at: string;
  };
}

interface AvailabilityBroadcastPayload {
  caregiver_id: number;
  is_available: boolean;
  lat: number | null;
  lng: number | null;
  service_radius_km: number;
}

export async function PATCH(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const rows = await db<any>`
      UPDATE caregivers
      SET    is_available = NOT is_available
      WHERE  id = ${caregiver.id}
      RETURNING id, user_id, is_available, current_lat, current_lng, service_radius_km
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: "Caregiver profile not found during update" },
        { status: 404 },
      );
    }

    const updated = rows[0];

    // Fire and forget broadcast
    try {
      const payload: AvailabilityBroadcastPayload = {
        caregiver_id: updated.id,
        is_available: updated.is_available,
        lat: updated.current_lat,
        lng: updated.current_lng,
        service_radius_km: updated.service_radius_km,
      };

      supabase.channel("caregivers:availability").send({
        type: "broadcast",
        event: "availability_changed",
        payload,
      });
    } catch (broadcastErr) {
      console.error("[availability+api] Broadcast failed:", broadcastErr);
    }

    const responseData: AvailabilityToggleResponse = {
      success: true,
      data: {
        caregiver_id: updated.id,
        is_available: updated.is_available,
        updated_at: new Date().toISOString(),
      },
    };

    return Response.json(responseData, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const rows = await db<any>`
      SELECT *
      FROM caregiver_availability
      WHERE caregiver_id = ${caregiver.id}
      ORDER BY day_of_week ASC, start_time ASC
    `;

    return Response.json({ success: true, data: rows }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[availability+api GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);
    const body = await request.json();

    if (!Array.isArray(body.availability)) {
      return Response.json(
        { error: "availability must be an array" },
        { status: 400 },
      );
    }

    // Validate slots
    for (const slot of body.availability) {
      if (
        typeof slot.day_of_week !== "number" ||
        slot.day_of_week < 0 ||
        slot.day_of_week > 6
      ) {
        return Response.json(
          { error: "day_of_week must be between 0 and 6" },
          { status: 400 },
        );
      }
      if (
        !slot.start_time ||
        !slot.end_time ||
        slot.start_time >= slot.end_time
      ) {
        return Response.json(
          { error: "start_time must be less than end_time" },
          { status: 400 },
        );
      }
    }

    // Wrap in standard multi-statement transaction via neon HTTP's transaction bundle array helper
    // Since neon returns a batch, we can pass standard sql objects
    const queries = [];

    queries.push(
      sql`DELETE FROM caregiver_availability WHERE caregiver_id = ${caregiver.id}`,
    );

    for (const slot of body.availability) {
      queries.push(sql`
        INSERT INTO caregiver_availability (caregiver_id, day_of_week, start_time, end_time, is_active)
        VALUES (${caregiver.id}, ${slot.day_of_week}, ${slot.start_time}, ${slot.end_time}, true)
      `);
    }

    // execute as a batch transaction natively
    await sql.transaction(queries);

    return Response.json(
      { success: true, message: "Availability updated" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[availability+api PUT]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
