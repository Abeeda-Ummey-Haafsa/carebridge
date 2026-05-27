import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { Caregiver } from "@/types/db";

export async function GET(request: Request) {
  try {
    const { user, caregiver } = await requireCaregiver(request);

    // Run additional queries in parallel
    const [
      caregiverRows,
      certificationsRows,
      availabilityRows,
      notificationRows,
      statsRows
    ] = await Promise.all([
      db<any>`
        SELECT c.*, u.name, u.email
        FROM caregivers c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ${caregiver.id}
      `,
      db<any>`
        SELECT *
        FROM caregiver_certifications
        WHERE caregiver_id = ${caregiver.id}
      `,
      db<any>`
        SELECT *
        FROM caregiver_availability
        WHERE caregiver_id = ${caregiver.id}
      `,
      db<{ count: number }>`
        SELECT CAST(COUNT(*) AS INTEGER) as count
        FROM notifications
        WHERE user_id = ${user.id} AND is_read = false
      `,
      db<{ total_completed: number }>`
        SELECT CAST(COUNT(*) AS INTEGER) as total_completed
        FROM care_sessions
        WHERE caregiver_id = ${caregiver.id} AND status = 'completed'
      `
    ]);

    if (caregiverRows.length === 0) {
      return Response.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const caregiverData = caregiverRows[0];
    const unread_notifications = notificationRows[0]?.count || 0;
    const total_completed_sessions = statsRows[0]?.total_completed || 0;

    const data = {
      ...caregiverData,
      certifications: certificationsRows,
      availability: availabilityRows,
      unread_notifications,
      quick_stats: {
        total_completed_sessions,
        avg_rating: caregiverData.avg_rating,
        response_rate: 100 // placeholder since mock doesn't define response logic natively
      }
    };

    return Response.json({ success: true, data }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[me+api GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);
    const body = await request.json();

    const [existing] = await db<Caregiver>`
      SELECT * FROM caregivers WHERE id = ${caregiver.id}
    `;

    if (!existing) {
      return Response.json({ error: "Caregiver not found" }, { status: 404 });
    }

    // Validation rules
    if (body.hourly_rate !== undefined) {
      if (typeof body.hourly_rate !== 'number' || body.hourly_rate <= 0 || body.hourly_rate > 999.99) {
        return Response.json({ error: "hourly_rate must be between 0 and 999.99" }, { status: 400 });
      }
    }

    if (body.care_types !== undefined && Array.isArray(body.care_types)) {
        const allowedTypes = ["companion", "personal", "nursing", "specialized"];
        if (!body.care_types.every((t: string) => allowedTypes.includes(t))) {
          return Response.json({ error: "Invalid care_types" }, { status: 400 });
        }
    }

    // Default to existing values if not provided
    const bio = body.bio !== undefined ? body.bio : existing.bio;
    const hourly_rate =
      body.hourly_rate !== undefined ? body.hourly_rate : existing.hourly_rate;
    const years_experience =
      body.years_experience !== undefined
        ? body.years_experience
        : existing.years_experience;
    const service_radius_km =
      body.service_radius_km !== undefined
        ? body.service_radius_km
        : existing.service_radius_km;

    // Arrays need JSON stringification for Neon tagged templates to inject as JSONB/array
    const care_types =
      body.care_types !== undefined ? body.care_types : existing.care_types;
    const languages =
      body.languages !== undefined ? body.languages : existing.languages;

    const rows = await db<Caregiver>`
      UPDATE caregivers
      SET 
        bio = ${bio},
        hourly_rate = ${hourly_rate},
        years_experience = ${years_experience},
        service_radius_km = ${service_radius_km},
        care_types = ${care_types ? JSON.stringify(care_types) : null}::jsonb,
        languages = ${languages ? JSON.stringify(languages) : null}::jsonb
      WHERE id = ${caregiver.id}
      RETURNING *
    `;

    return Response.json({ success: true, data: rows[0] }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[me+api PATCH]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
