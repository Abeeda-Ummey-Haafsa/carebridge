/*
  FILE: app/(api)/relative/bookings+api.ts
  PURPOSE: POST /api/relative/bookings
           Creates a new caregiving session booking. The core transaction
           of the entire Relative dashboard. Validates caregiver
           availability, prevents scheduling conflicts, snapshots rate
           and elder location, then notifies the caregiver.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  {
    elder_id:         number    (required)
    caregiver_id:     number    (required)
    care_type:        string    (required)
    scheduled_at:     string    (required — ISO 8601 UTC timestamp)
    duration_minutes: number    (required — integer, 1 to 1440)
    is_immediate:     boolean   (optional, default false)
  }

  Validation rules:
    - elder_id, caregiver_id: positive integers
    - care_type: non-empty string
    - scheduled_at: valid ISO 8601 timestamp, at least 30 minutes in the
      future for non-immediate bookings (is_immediate = false)
    - duration_minutes: integer, 1 <= value <= 1440
  Return 400 with specific message on each failure.

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions
    id, elder_id, caregiver_id, booked_by_user_id, care_type, is_immediate,
    status, scheduled_at, duration_minutes, hourly_rate, total_cost,
    elder_address, elder_lat, elder_lng, created_at, updated_at

  TABLE caregivers
    id, user_id, hourly_rate, is_available

  TABLE users            (caregiver's user row)
    id, name

  TABLE elders
    id, user_id, home_address, home_lat, home_lng

  TABLE users            (elder's user row)
    id, name

  TABLE messages         (for system message insert)
  TABLE device_tokens    (for caregiver push notification)
  TABLE notifications    (for in-app notification record)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse + validate request body (see Validation rules above)

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')
             requireRelativeOwnership(user.id, body.elder_id)
               → 403 if elder not linked to this relative

  STEP 3 — Fetch caregiver to snapshot hourly_rate + verify availability
    SELECT id, user_id, hourly_rate, is_available
    FROM   caregivers WHERE id = ${body.caregiver_id}
    404 if not found.
    If is_available = false → 409:
      { error: 'Caregiver is not currently available' }

  STEP 4 — Fetch caregiver user row (for push notification name)
    SELECT name FROM users WHERE id = ${caregiver.user_id}

  STEP 5 — Fetch elder to snapshot location
    SELECT home_address, home_lat, home_lng, user_id
    FROM   elders WHERE id = ${body.elder_id}
    Also fetch elder name: SELECT name FROM users WHERE id = elder.user_id

  STEP 6 — OVERLAP CHECK
    Compute booking window end time:
      bookingEnd = new Date(body.scheduled_at).getTime()
                   + body.duration_minutes * 60_000

    SELECT COUNT(*)::INT AS overlap_count
    FROM   care_sessions
    WHERE  caregiver_id = ${body.caregiver_id}
      AND  status NOT IN ('declined', 'cancelled', 'completed')
      AND  scheduled_at < ${new Date(bookingEnd).toISOString()}
      AND  (scheduled_at + duration_minutes * INTERVAL '1 minute')
           > ${body.scheduled_at}

    If overlap_count > 0 → 409:
      { error: 'Caregiver has a conflicting booking in this time window' }

  STEP 7 — Compute total_cost
    total_cost = parseFloat(
      ((body.duration_minutes / 60) * caregiver.hourly_rate).toFixed(2)
    )

  STEP 8 — INSERT care_sessions
    INSERT INTO care_sessions (
      elder_id, caregiver_id, booked_by_user_id, care_type, is_immediate,
      status, scheduled_at, duration_minutes, hourly_rate, total_cost,
      elder_address, elder_lat, elder_lng
    ) VALUES (
      ${body.elder_id}, ${body.caregiver_id}, ${user.id},
      ${body.care_type}, ${body.is_immediate ?? false},
      'pending', ${body.scheduled_at}, ${body.duration_minutes},
      ${caregiver.hourly_rate}, ${total_cost},
      ${elder.home_address}, ${elder.home_lat}, ${elder.home_lng}
    )
    RETURNING id, status, scheduled_at, total_cost, hourly_rate

  STEP 9 — INSERT system message (fire-and-forget, try/catch)
    INSERT INTO messages (session_id, sender_user_id, content, message_type)
    VALUES (${newSession.id}, ${user.id}, 'Booking request created', 'system')

  STEP 10 — NOTIFY CAREGIVER (fire-and-forget, try/catch)
    a) INSERT into notifications:
         user_id      = caregiver.user_id
         title        = 'New Booking Request'
         body         = '${elderName} has requested ${body.care_type} care'
         type         = 'booking_request'
         related_id   = newSession.id
         related_type = 'care_session'
    b) Fetch device_tokens WHERE user_id = caregiver.user_id
    c) Send Expo push to each token:
         { to, title: 'New Booking Request',
           body: '${elderName} has requested ${body.care_type} care',
           data: { session_id: newSession.id, type: 'booking_request' } }

  STEP 11 — Return 201:
    {
      success: true,
      data: {
        sessionId:     number,
        status:        'pending',
        scheduledAt:   string,
        estimatedCost: number,
        caregiverName: string,
        elderName:     string,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Do NOT await STEP 9 or STEP 10 — both fire-and-forget
  - hourly_rate is SNAPSHOT from caregivers table at booking time —
    NOT recalculated later even if caregiver changes their rate
  - elder_address, elder_lat, elder_lng are SNAPSHOT from elders table
  - Overlap check uses actual session window — not just scheduled_at point
  - For is_immediate = true, skip the 30-minute future validation
  - total_cost rounded to 2dp using toFixed(2) → parseFloat
*/
import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const elderId = Number(body?.elder_id);
    const caregiverId = Number(body?.caregiver_id);
    const careType = String(body?.care_type ?? "").trim();
    const scheduledAt = String(body?.scheduled_at ?? "").trim();
    const durationMinutes = Number(body?.duration_minutes);
    const isImmediate = !!body?.is_immediate;

    if (!elderId || Number.isNaN(elderId))
      return Response.json({ error: "elder_id is required" }, { status: 400 });
    if (!caregiverId || Number.isNaN(caregiverId))
      return Response.json(
        { error: "caregiver_id is required" },
        { status: 400 },
      );
    if (!careType)
      return Response.json({ error: "care_type is required" }, { status: 400 });
    if (!scheduledAt)
      return Response.json(
        { error: "scheduled_at is required" },
        { status: 400 },
      );
    if (
      !durationMinutes ||
      Number.isNaN(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 1440
    ) {
      return Response.json(
        { error: "duration_minutes must be between 1 and 1440" },
        { status: 400 },
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return Response.json(
        { error: "scheduled_at must be a valid ISO timestamp" },
        { status: 400 },
      );
    }

    const { user } = await requireRelative(request);

    // Ownership check
    await requireRelativeOwnership(user.id, elderId);

    // If not immediate, ensure at least 30 minutes in the future
    if (!isImmediate) {
      const minStart = Date.now() + 30 * 60 * 1000;
      if (scheduledDate.getTime() < minStart) {
        return Response.json(
          {
            error:
              "scheduled_at must be at least 30 minutes in the future for non-immediate bookings",
          },
          { status: 400 },
        );
      }
    }

    // Fetch caregiver snapshot
    const caregiverRows = await db<any>`
      SELECT id, user_id, hourly_rate::FLOAT AS hourly_rate, is_available
      FROM caregivers
      WHERE id = ${caregiverId}
      LIMIT 1
    `;

    if (!caregiverRows || caregiverRows.length === 0) {
      return Response.json({ error: "Caregiver not found" }, { status: 404 });
    }

    const caregiver = caregiverRows[0];
    if (!caregiver.is_available) {
      return Response.json(
        { error: "Caregiver is not currently available" },
        { status: 409 },
      );
    }

    // Fetch caregiver user name
    const caregiverUserRows = await db<{ name: string }>`
      SELECT name FROM users WHERE id = ${caregiver.user_id} LIMIT 1
    `;
    const caregiverName = caregiverUserRows?.[0]?.name ?? null;

    // Fetch elder snapshot
    const elderRows = await db<any>`
      SELECT e.home_address, e.home_lat, e.home_lng, e.user_id
      FROM elders e
      WHERE e.id = ${elderId}
      LIMIT 1
    `;
    if (!elderRows || elderRows.length === 0) {
      return Response.json({ error: "Elder not found" }, { status: 404 });
    }

    const elder = elderRows[0];

    const elderUserRows = await db<{ name: string }>`
      SELECT name FROM users WHERE id = ${elder.user_id} LIMIT 1
    `;
    const elderName = elderUserRows?.[0]?.name ?? "Elder";

    // Overlap check
    const bookingEndIso = new Date(
      scheduledDate.getTime() + durationMinutes * 60000,
    ).toISOString();

    const overlapRows = await db<{ overlap_count: number }>`
      SELECT COUNT(*)::INT AS overlap_count
      FROM care_sessions
      WHERE caregiver_id = ${caregiverId}
        AND status NOT IN ('declined', 'cancelled', 'completed')
        AND scheduled_at < ${bookingEndIso}
        AND (scheduled_at + (duration_minutes * INTERVAL '1 minute')) > ${scheduledAt}
    `;

    if ((overlapRows?.[0]?.overlap_count ?? 0) > 0) {
      return Response.json(
        { error: "Caregiver has a conflicting booking in this time window" },
        { status: 409 },
      );
    }

    // Compute total cost snapshot
    const hourly = caregiver.hourly_rate ?? 0;
    const totalCost = parseFloat(((durationMinutes / 60) * hourly).toFixed(2));

    // Insert session
    const inserted = await db<any>`
      INSERT INTO care_sessions (
        elder_id, caregiver_id, booked_by_user_id, care_type, is_immediate,
        status, scheduled_at, duration_minutes, hourly_rate, total_cost,
        elder_address, elder_lat, elder_lng
      ) VALUES (
        ${elderId}, ${caregiverId}, ${user.id}, ${careType}, ${isImmediate},
        'pending', ${scheduledAt}, ${durationMinutes}, ${hourly}, ${totalCost},
        ${elder.home_address}, ${elder.home_lat}, ${elder.home_lng}
      ) RETURNING id, status, scheduled_at, total_cost, hourly_rate
    `;

    const newSession = inserted[0];

    // Fire-and-forget: insert system message + notify caregiver
    void (async () => {
      try {
        await db`
          INSERT INTO messages (session_id, sender_user_id, content, message_type)
          VALUES (${newSession.id}, ${user.id}, ${"Booking request created"}, 'system')
        `;
      } catch (msgErr) {
        console.error("Failed to insert system message", msgErr);
      }
    })();

    void (async () => {
      try {
        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES (${caregiver.user_id}, ${"New Booking Request"}, ${elderName + " has requested " + careType}, ${"booking_request"}, ${newSession.id}, ${"care_session"})
        `;

        const tokenRows = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${caregiver.user_id}
        `;

        if (tokenRows.length > 0) {
          const expoMessages = tokenRows.map((t) => ({
            to: t.token,
            title: "New Booking Request",
            body: `${elderName} has requested ${careType}`,
            data: { session_id: newSession.id, type: "booking_request" },
          }));

          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(expoMessages),
          });
        }
      } catch (notifyErr) {
        console.error("Failed to notify caregiver", notifyErr);
      }
    })();

    // Fire-and-forget: realtime broadcast
    void (async () => {
      try {
        await supabase.channel(`caregiver:${caregiverId}`).send({
          type: "broadcast",
          event: "new_booking",
          payload: {
            sessionId: newSession.id,
            scheduledAt: newSession.scheduled_at,
          },
        });
      } catch (err) {
        console.error("Realtime notify failed", err);
      }
    })();

    return Response.json(
      {
        success: true,
        data: {
          sessionId: newSession.id,
          status: newSession.status,
          scheduledAt: newSession.scheduled_at,
          estimatedCost: newSession.total_cost,
          caregiverName,
          elderName,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/bookings] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
