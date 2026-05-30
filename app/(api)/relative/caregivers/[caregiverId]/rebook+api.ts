import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { caregiverId: string } },
) {
  try {
    const caregiverId = parseInt(params.caregiverId, 10);
    if (Number.isNaN(caregiverId)) {
      return Response.json({ error: "Invalid caregiverId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);
    if (!elderIds || elderIds.length === 0) {
      return Response.json(
        { error: "No linked elders found" },
        { status: 404 },
      );
    }

    const rows = await db<any>`
      SELECT cs.care_type, cs.duration_minutes, cs.hourly_rate, cg.is_available, cg.hourly_rate AS current_rate, u.name AS caregiver_name
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users u ON cg.user_id = u.id
      WHERE cs.caregiver_id = ${caregiverId}
        AND cs.elder_id = ANY(${elderIds}::int[])
        AND cs.status = 'completed'
      ORDER BY cs.scheduled_at DESC
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return Response.json(
        { error: "No prior completed sessions with this caregiver" },
        { status: 404 },
      );
    }

    const last = rows[0];

    const availability = await db<any>`
      SELECT day_of_week, start_time, end_time
      FROM caregiver_availability
      WHERE caregiver_id = ${caregiverId}
        AND is_active = true
      ORDER BY day_of_week ASC
    `;

    return Response.json({
      success: true,
      data: {
        lastCareType: last.care_type,
        lastDuration: last.duration_minutes,
        caregiverName: last.caregiver_name,
        currentHourlyRate: last.current_rate ?? last.hourly_rate ?? null,
        isAvailable: !!last.is_available,
        availability: availability || [],
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/caregivers/rebook] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/caregivers/[caregiverId]/rebook+api.ts
  PURPOSE: GET /api/relative/caregivers/:caregiverId/rebook
           Returns the last completed session with this caregiver
           to pre-fill the booking form fields when rebooking.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function GET(
    request: Request,
    { params }: { params: { caregiverId: string } }
  )
  caregiverId = parseInt(params.caregiverId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse caregiverId

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — const elderIds = await getRelativeElderIds(user.id)

  STEP 4 — Fetch last completed session with this caregiver
    SELECT
      cs.care_type, cs.duration_minutes, cs.hourly_rate,
      cg.is_available, cg.hourly_rate AS current_rate,
      u.name AS caregiver_name
    FROM   care_sessions cs
    JOIN   caregivers cg ON cs.caregiver_id = cg.id
    JOIN   users      u  ON cg.user_id      = u.id
    WHERE  cs.caregiver_id = ${caregiverId}
      AND  cs.elder_id     = ANY(${elderIds}::int[])
      AND  cs.status       = 'completed'
    ORDER  BY cs.scheduled_at DESC
    LIMIT  1
    404 if not found (no prior session with this caregiver).

  STEP 5 — Fetch caregiver weekly availability
    SELECT day_of_week, start_time, end_time
    FROM   caregiver_availability
    WHERE  caregiver_id = ${caregiverId}
      AND  is_active    = true
    ORDER  BY day_of_week ASC

  STEP 6 — Return 200:
    {
      success: true,
      data: {
        lastCareType:     string,
        lastDuration:     number,
        caregiverName:    string,
        currentHourlyRate: number,
        isAvailable:      boolean,
        availability:     Array,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - currentHourlyRate uses cg.hourly_rate (current), not cs.hourly_rate
    (snapshotted rate) — show current rate for new booking
  - Return 404 if no prior sessions — UI shows standard booking form
  - Use ANY(elderIds) to ensure the past session belongs to this relative
*/
