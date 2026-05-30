/*
  FILE: app/(api)/caregivers/[caregiverId]/reviews+api.ts
  PURPOSE: GET /api/caregivers/:caregiverId/reviews
           Returns paginated reviews for a caregiver's detail modal.
           Powers the Reviews section (Section 5) in the Find Care screen.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function GET(
    request: Request,
    { params }: { params: { caregiverId: string } }
  )
  caregiverId = parseInt(params.caregiverId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── QUERY PARAMS ──────────────────────────────────────────────────────────
  page:  string (default '1')
  limit: string (default '10', max '20')

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE reviews   alias: r
    id               SERIAL PK
    session_id       INTEGER UNIQUE NOT NULL
    reviewer_user_id INTEGER NOT NULL
    caregiver_id     INTEGER NOT NULL
    rating           SMALLINT NOT NULL
    comment          TEXT
    created_at       TIMESTAMP

  TABLE users     alias: u  (reviewer)
    id   SERIAL PK
    name VARCHAR(100)

  TABLE care_sessions   alias: cs
    id        SERIAL PK
    care_type VARCHAR(100)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse caregiverId, page, limit
    page  = Math.max(1, parseInt(pageParam ?? '1'))
    limit = Math.min(parseInt(limitParam ?? '10'), 20)
    offset = (page - 1) * limit

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Run both queries in parallel with Promise.all():

    QUERY A — Paginated reviews
      SELECT
        r.id, r.rating, r.comment, r.created_at,
        u.name AS reviewer_name,
        cs.care_type
      FROM   reviews r
      JOIN   users        u  ON r.reviewer_user_id = u.id
      JOIN   care_sessions cs ON r.session_id      = cs.id
      WHERE  r.caregiver_id = ${caregiverId}
      ORDER  BY r.created_at DESC
      LIMIT  ${limit}
      OFFSET ${offset}

    QUERY B — Total count
      SELECT COUNT(*)::INT AS total
      FROM   reviews
      WHERE  caregiver_id = ${caregiverId}

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        reviews: Array,
        pagination: {
          total:   number,
          page:    number,
          limit:   number,
          hasMore: boolean,  // offset + limit < total
        }
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - NEVER expose reviewer_user_id or reviewer email — only reviewer name
  - Use OFFSET pagination here (small dataset, not for infinite scroll)
  - Both queries run in parallel via Promise.all()
  - Return empty reviews array (not 404) if caregiver has no reviews
*/
import { NextResponse } from "next/server";
import { requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { caregiverId: string } },
) {
  const caregiverId = parseInt(params.caregiverId, 10);
  if (Number.isNaN(caregiverId)) {
    return new NextResponse(JSON.stringify({ error: "Invalid caregiverId" }), {
      status: 400,
    });
  }

  const url = new URL(request.url);
  const page = Math.max(
    1,
    parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
  );
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "10", 10) || 10,
    20,
  );
  const offset = (page - 1) * limit;

  await requireRelative(request);

  const [reviewsRows, countRows] = await Promise.all([
    db<{
      id: number;
      rating: number;
      comment: string | null;
      created_at: string;
      reviewer_name: string;
      care_type: string | null;
    }>`
      SELECT r.id, r.rating, r.comment, r.created_at,
             u.name AS reviewer_name,
             cs.care_type
      FROM reviews r
      JOIN users u ON r.reviewer_user_id = u.id
      JOIN care_sessions cs ON r.session_id = cs.id
      WHERE r.caregiver_id = ${caregiverId}
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `,
    db<{ total: number }>`
      SELECT COUNT(*)::INT AS total
      FROM reviews
      WHERE caregiver_id = ${caregiverId}
    `,
  ]);

  const total = countRows?.[0]?.total ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      reviews: (reviewsRows || []).map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerName: r.reviewer_name,
        careType: r.care_type,
      })),
      pagination: {
        total,
        page,
        limit,
        hasMore: offset + limit < total,
      },
    },
  });
}
