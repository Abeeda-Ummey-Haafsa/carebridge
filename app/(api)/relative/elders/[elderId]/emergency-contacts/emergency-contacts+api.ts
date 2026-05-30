/*
  FILE: app/(api)/relative/elders/[elderId]/emergency-contacts+api.ts
  PURPOSE: GET /api/relative/elders/:elderId/emergency-contacts
           Returns all emergency contacts for an elder, primary first.
           Powers the Emergency & Safety Settings section in Profile.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  Both GET and POST handlers:
    (request: Request, { params }: { params: { elderId: string } })
  elderId = parseInt(params.elderId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE elder_emergency_contacts
    id           SERIAL PK
    elder_id     INTEGER NOT NULL
    name         VARCHAR(100) NOT NULL
    phone        VARCHAR(20) NOT NULL
    relationship VARCHAR(50)
    is_primary   BOOLEAN DEFAULT false
    created_at   TIMESTAMP

  ── GET STEPS ─────────────────────────────────────────────────────────────

  STEP 1 — Parse elderId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')
             requireRelativeOwnership(user.id, elderId)

  STEP 3 — Query
    SELECT id, name, phone, relationship, is_primary, created_at
    FROM   elder_emergency_contacts
    WHERE  elder_id = ${elderId}
    ORDER  BY is_primary DESC, created_at ASC

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        contacts: Array,
        total: number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - requireRelativeOwnership MUST run before query
  - Order: primary contact first, then by created_at
  - Return empty array if no emergency contacts yet
*/
import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db, dbTransaction } from "@/lib/db";

export async function GET(
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

    const rows = await db<any>`
      SELECT id, name, phone, relationship, is_primary, created_at
      FROM elder_emergency_contacts
      WHERE elder_id = ${elderId}
      ORDER BY is_primary DESC, created_at ASC
    `;

    return Response.json({
      success: true,
      data: { contacts: rows || [], total: (rows || []).length },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/emergency-contacts GET] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { elderId: string } },
) {
  try {
    const elderId = parseInt(params.elderId, 10);
    if (Number.isNaN(elderId)) {
      return Response.json({ error: "Invalid elderId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const relationship =
      typeof body.relationship === "string" ? body.relationship.trim() : null;
    const isPrimary = !!body.is_primary;

    if (
      !name ||
      name.length === 0 ||
      name.length > 100 ||
      !phone ||
      phone.length === 0 ||
      phone.length > 20
    ) {
      return Response.json({ error: "Invalid contact data" }, { status: 400 });
    }

    const { user } = await requireRelative(request);
    await requireRelativeOwnership(user.id, elderId);

    if (isPrimary) {
      // Demote existing primary and insert in a transaction
      const result = await dbTransaction(async (tx) => {
        await tx`
          UPDATE elder_emergency_contacts
          SET is_primary = false
          WHERE elder_id = ${elderId} AND is_primary = true
        `;

        const insertedRaw = await tx`
          INSERT INTO elder_emergency_contacts (elder_id, name, phone, relationship, is_primary)
          VALUES (${elderId}, ${name}, ${phone}, ${relationship}, ${true})
          RETURNING id, name, phone, relationship, is_primary
        `;

        const inserted = (insertedRaw as any[])[0];

        return inserted;
      });

      return Response.json(
        { success: true, data: { contact: result } },
        { status: 201 },
      );
    }

    const insertedRaw = await db`
      INSERT INTO elder_emergency_contacts (elder_id, name, phone, relationship, is_primary)
      VALUES (${elderId}, ${name}, ${phone}, ${relationship}, ${false})
      RETURNING id, name, phone, relationship, is_primary
    `;

    const insertedRow = (insertedRaw as any[])[0];

    return Response.json(
      { success: true, data: { contact: insertedRow } },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/emergency-contacts POST] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/*
  NOTE: Add this POST handler to the same emergency-contacts+api.ts file.

  PURPOSE: POST /api/relative/elders/:elderId/emergency-contacts
           Adds a new emergency contact for an elder. If is_primary = true,
           demotes any existing primary contact first.

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  {
    name:         string    (required, max 100)
    phone:        string    (required, max 20)
    relationship: string    (optional)
    is_primary:   boolean   (optional, default false)
  }
  Validate name and phone are non-empty. Return 400 on failure.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse elderId + validate body

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')
             requireRelativeOwnership(user.id, elderId)

  STEP 3 — If body.is_primary = true:
    UPDATE elder_emergency_contacts
    SET    is_primary = false
    WHERE  elder_id = ${elderId} AND is_primary = true

  STEP 4 — INSERT contact
    INSERT INTO elder_emergency_contacts
      (elder_id, name, phone, relationship, is_primary)
    VALUES
      (${elderId}, ${body.name.trim()}, ${body.phone.trim()},
       ${body.relationship ?? null}, ${body.is_primary ?? false})
    RETURNING id, name, phone, relationship, is_primary

  STEP 5 — Return 201:
    { success: true, data: { contact:  } }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Demote existing primary BEFORE inserting new one (STEP 3 runs first)
  - Steps 3 and 4 should be wrapped in a transaction when is_primary = true
  - Trim name and phone before insert
*/
