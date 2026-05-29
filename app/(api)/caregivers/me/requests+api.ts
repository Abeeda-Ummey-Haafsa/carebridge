import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import type { CareSession } from "@/types/db";

type RequestRow = CareSession & {
  elder_name: string;
  estimated_pay: number;
  distance_km: number | null;
};

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);

    const rows = await db<CareSession & { elder_name: string }>`
      SELECT
        cs.id, cs.elder_id, cs.caregiver_id, cs.care_type, cs.status,
        cs.scheduled_at, cs.duration_minutes, cs.hourly_rate,
        cs.elder_lat, cs.elder_lng, cs.elder_address, cs.created_at,
        u.name AS elder_name
      FROM   care_sessions cs
      JOIN   elders e ON cs.elder_id = e.id
      JOIN   users  u ON e.user_id   = u.id
      WHERE  cs.caregiver_id = ${caregiver.id}
        AND  cs.status = 'pending'
      ORDER  BY cs.scheduled_at ASC
    `;

    // Step 1: filter
    const filtered = rows.filter((session) => {
      // care_types match
      if (!caregiver.care_types?.includes(session.care_type)) return false;

      // distance check — only applied when both sets of coords exist
      if (
        caregiver.current_lat != null &&
        caregiver.current_lng != null &&
        session.elder_lat != null &&
        session.elder_lng != null
      ) {
        const R = 6371;
        const dLat =
          ((session.elder_lat - caregiver.current_lat) * Math.PI) / 180;
        const dLng =
          ((session.elder_lng - caregiver.current_lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((caregiver.current_lat * Math.PI) / 180) *
            Math.cos((session.elder_lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (distance > (caregiver.service_radius_km ?? 20)) return false;
      }

      return true;
    });

    // Step 2: transform — always compute pay; compute distance separately
    const result: RequestRow[] = filtered.map((session) => {
      let distance_km: number | null = null;

      if (
        caregiver.current_lat != null &&
        caregiver.current_lng != null &&
        session.elder_lat != null &&
        session.elder_lng != null
      ) {
        const R = 6371;
        const dLat =
          ((session.elder_lat - caregiver.current_lat) * Math.PI) / 180;
        const dLng =
          ((session.elder_lng - caregiver.current_lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((caregiver.current_lat * Math.PI) / 180) *
            Math.cos((session.elder_lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        distance_km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      }

      return {
        ...session,
        estimated_pay:
          (session.duration_minutes / 60) * (caregiver.hourly_rate ?? 0),
        distance_km,
      };
    });

    return Response.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[requests+api GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
