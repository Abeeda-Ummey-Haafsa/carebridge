/*
  FILE: app/(api)/relative/elders/[elderId]+api.ts
  PURPOSE: PATCH /api/relative/elders/:elderId
           Updates the elder's profile information. Requires two
           UPDATE statements (users table + elders table) and
           relative ownership verification.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function PATCH(
    request: Request,
    { params }: { params: { elderId: string } }
  )
  elderId = parseInt(params.elderId, 10). Return 400 if NaN.

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  All fields optional (partial update):
  {
    name?:               string
    dateOfBirth?:        string
    mobilityLevel?:      string
    medicalNotes?:       string
    allergies?:          string
    preferredLanguages?: string[]
    homeAddress?:        string
    homeLat?:            number
    homeLng?:            number
  }
  Validate each field if provided.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse elderId + validate provided body fields

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')
             requireRelativeOwnership(user.id, elderId)

  STEP 3 — Fetch current elder to get user_id
    SELECT e.id, e.user_id FROM elders e WHERE e.id = ${elderId}
    404 if not found.

  STEP 4 — Run both UPDATEs in parallel with Promise.all()
    (only update tables where relevant fields are provided)

    If body.name provided:
      UPDATE users SET name = ${body.name.trim()} WHERE id = ${elder.user_id}
      RETURNING name

    If any elders-table fields provided:
      UPDATE elders
      SET    date_of_birth       = COALESCE(${body.dateOfBirth ?? null},   date_of_birth),
             medical_notes       = COALESCE(${body.medicalNotes ?? null},  medical_notes),
             allergies           = COALESCE(${body.allergies ?? null},     allergies),
             mobility_level      = COALESCE(${body.mobilityLevel ?? null}, mobility_level),
             preferred_languages = COALESCE(${body.preferredLanguages ?? null}, preferred_languages),
             home_address        = COALESCE(${body.homeAddress ?? null},   home_address),
             home_lat            = COALESCE(${body.homeLat ?? null},       home_lat),
             home_lng            = COALESCE(${body.homeLng ?? null},       home_lng)
      WHERE  id = ${elderId}
      RETURNING *

  STEP 5 — Return 200:
    {
      success: true,
      data: {
        elderId:            number,
        name:               string,
        mobilityLevel:      string | null,
        medicalNotes:       string | null,
        allergies:          string | null,
        preferredLanguages: string[],
        homeAddress:        string | null,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - COALESCE pattern: only update columns where new value is provided
    (do NOT overwrite existing values with null for omitted fields)
  - requireRelativeOwnership MUST run before any UPDATE
  - Do NOT use SELECT * — list columns explicitly in RETURNING clause
*/
import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { elderId: string } },
) {
  try {
    const elderId = parseInt(params.elderId, 10);
    if (Number.isNaN(elderId)) {
      return Response.json({ error: "Invalid elderId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const { user } = await requireRelative(request);
    await requireRelativeOwnership(user.id, elderId);

    const elderRows = await db<{
      id: number;
      user_id: number;
    }>`SELECT id, user_id FROM elders WHERE id = ${elderId} LIMIT 1`;
    if (!elderRows || elderRows.length === 0) {
      return Response.json({ error: "Elder not found" }, { status: 404 });
    }

    const elder = elderRows[0];

    const updates: Promise<any>[] = [];

    if (
      typeof body.name === "string" &&
      body.name.trim().length > 0 &&
      body.name.trim().length <= 100
    ) {
      updates.push(
        db`UPDATE users SET name = ${body.name.trim()} WHERE id = ${elder.user_id} RETURNING name`,
      );
    }

    const elderFields = {
      date_of_birth:
        typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : null,
      medical_notes:
        typeof body.medicalNotes === "string"
          ? body.medicalNotes.trim() || null
          : null,
      allergies:
        typeof body.allergies === "string"
          ? body.allergies.trim() || null
          : null,
      mobility_level:
        typeof body.mobilityLevel === "string"
          ? body.mobilityLevel.trim()
          : null,
      preferred_languages: Array.isArray(body.preferredLanguages)
        ? body.preferredLanguages.filter((v: any) => typeof v === "string")
        : null,
      home_address:
        typeof body.homeAddress === "string"
          ? body.homeAddress.trim() || null
          : null,
      home_lat: typeof body.homeLat === "number" ? body.homeLat : null,
      home_lng: typeof body.homeLng === "number" ? body.homeLng : null,
    } as any;

    const elderUpdateNeeded = Object.values(elderFields).some(
      (v) => v !== null,
    );
    if (elderUpdateNeeded) {
      updates.push(db<any>`
        UPDATE elders
        SET date_of_birth = COALESCE(${elderFields.date_of_birth}, date_of_birth),
            medical_notes = COALESCE(${elderFields.medical_notes}, medical_notes),
            allergies = COALESCE(${elderFields.allergies}, allergies),
            mobility_level = COALESCE(${elderFields.mobility_level}, mobility_level),
            preferred_languages = COALESCE(${elderFields.preferred_languages}, preferred_languages),
            home_address = COALESCE(${elderFields.home_address}, home_address),
            home_lat = COALESCE(${elderFields.home_lat}, home_lat),
            home_lng = COALESCE(${elderFields.home_lng}, home_lng)
        WHERE id = ${elderId}
        RETURNING id, home_address, mobility_level, medical_notes, allergies, preferred_languages
      `);
    }

    const results = await Promise.all(updates);

    const userNameRow = results.find((r) => r && r[0] && r[0].name);
    const elderRow = results.find((r) => r && r[0] && r[0].id);

    const response = {
      elderId,
      name: userNameRow ? userNameRow[0].name : undefined,
      mobilityLevel: elderRow ? elderRow[0].mobility_level : null,
      medicalNotes: elderRow ? elderRow[0].medical_notes : null,
      allergies: elderRow ? elderRow[0].allergies : null,
      preferredLanguages: elderRow ? elderRow[0].preferred_languages : [],
      homeAddress: elderRow ? elderRow[0].home_address : null,
    };

    return Response.json({ success: true, data: response });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/elders PATCH] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { elderId: string } },
) {
  try {
    const elderId = parseInt(params.elderId, 10);
    if (Number.isNaN(elderId)) {
      return Response.json({ error: "Invalid elderId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);
    await requireRelativeOwnership(user.id, elderId);

    const activeRows = await db<{ active_count: number }>`
      SELECT COUNT(*)::INT AS active_count
      FROM care_sessions
      WHERE elder_id = ${elderId}
        AND status IN ('arriving','checked_in','paused')
    `;

    if ((activeRows?.[0]?.active_count ?? 0) > 0) {
      return Response.json(
        {
          error: "Cannot unlink elder with an active care session in progress",
        },
        { status: 409 },
      );
    }

    const deleted = await db<{ id: number }>`
      DELETE FROM elder_relative_links
      WHERE elder_id = ${elderId} AND relative_user_id = ${user.id}
      RETURNING id
    `;

    if (!deleted || deleted.length === 0) {
      return Response.json({ error: "Link not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/elders DELETE] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/*
  NOTE: Add this DELETE handler to the same file as GET and PATCH.

  PURPOSE: DELETE /api/relative/elders/:elderId
           Soft-unlinks an elder from the relative by removing the
           elder_relative_links row. Does NOT delete the elder record.
           Blocked if the elder has active sessions.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse elderId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')
             requireRelativeOwnership(user.id, elderId) → 403

  STEP 3 — Block if elder has active sessions
    SELECT COUNT(*)::INT AS active_count
    FROM   care_sessions
    WHERE  elder_id = ${elderId}
      AND  status   IN ('arriving', 'checked_in', 'paused')
    If active_count > 0 → 409:
      { error: 'Cannot unlink elder with an active care session in progress' }

  STEP 4 — DELETE from elder_relative_links
    DELETE FROM elder_relative_links
    WHERE  elder_id         = ${elderId}
      AND  relative_user_id = ${user.id}
    If no row deleted → 404

  STEP 5 — Return 204 No Content

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - This is a SOFT UNLINK — the elders row and users row are NOT deleted
  - Block on active sessions (arriving/checked_in/paused) but NOT on
    upcoming/pending sessions
  - Return 204 with no body on success
*/
