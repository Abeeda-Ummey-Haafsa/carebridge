/*
  FILE: app/(api)/caregivers/nearby+api.ts
  PURPOSE: GET /api/caregivers/nearby
           Returns available caregivers within a radius of a given
           lat/lng point. The primary data source for the Find Care
           map markers and bottom sheet caregiver cards (Sections 2–4).
           This is the Uber-style caregiver discovery endpoint.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── QUERY PARAMS (all via new URL(request.url).searchParams) ─────────────
  Required:
    lat:       string  — center latitude  (float string)
    lng:       string  — center longitude (float string)
    radius_km: string  — search radius in km (float string, default '20')

  Optional filters:
    care_type:  string  — filter by care type (exact match)
    min_rating: string  — minimum avg_rating (float string)
    max_rate:   string  — maximum hourly_rate (float string)
    language:   string  — required language (contained in languages[])

  Sort:
    sort: 'nearest' | 'highest_rated' | 'lowest_price' | 'fastest_arrival'
    Default: 'nearest'

  Pagination:
    limit: string  — max results, default 20, cap 50

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE caregivers   alias: cg
    id               SERIAL PK
    user_id          INTEGER NOT NULL
    bio              TEXT
    hourly_rate      DECIMAL(10,2)
    years_experience INT
    care_types       TEXT[]
    languages        TEXT[]
    avg_rating       DECIMAL(3,2)
    total_reviews    INT
    is_available     BOOLEAN
    current_lat      DECIMAL(10,7)  nullable
    current_lng      DECIMAL(10,7)  nullable
    service_radius_km INT

  TABLE users        alias: u
    id   SERIAL PK
    name VARCHAR(100)

  ── HAVERSINE DISTANCE EXPRESSION ─────────────────────────────────────────
  Define as a reusable SQL fragment:
    (
      6371.0 * ACOS(
        LEAST(1.0,
          COS(RADIANS(${lat}::float)) *
          COS(RADIANS(cg.current_lat::float)) *
          COS(RADIANS(cg.current_lng::float) - RADIANS(${lng}::float)) +
          SIN(RADIANS(${lat}::float)) *
          SIN(RADIANS(cg.current_lat::float))
        )
      )
    )
  Alias: distance_km

  ── SORT ORDER MAP ────────────────────────────────────────────────────────
  const SORT_MAP = {
    nearest:         'distance_km ASC',
    highest_rated:   'cg.avg_rating DESC',
    lowest_price:    'cg.hourly_rate ASC',
    fastest_arrival: 'distance_km ASC',   // same as nearest; ETA refined client-side
  }

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse and validate required query params
    lat    = parseFloat(params.get('lat')   ?? '')
    lng    = parseFloat(params.get('lng')   ?? '')
    radius = parseFloat(params.get('radius_km') ?? '20')
    If lat/lng are NaN or out of range → 400:
      { error: 'Valid lat (-90 to 90) and lng (-180 to 180) are required' }
    limit = Math.min(parseInt(params.get('limit') ?? '20'), 50)
    sort  = SORT_MAP[params.get('sort') ?? 'nearest'] ?? SORT_MAP.nearest

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Build dynamic WHERE conditions array:
    Base (always):
      cg.is_available    = true
      cg.current_lat    IS NOT NULL
      cg.current_lng    IS NOT NULL
      [Haversine expression] <= LEAST(radius, cg.service_radius_km)

    Optional care_type filter (if param provided):
      ${careType} = ANY(cg.care_types)

    Optional min_rating filter:
      cg.avg_rating >= ${minRating}

    Optional max_rate filter:
      cg.hourly_rate <= ${maxRate}

    Optional language filter:
      ${language} = ANY(cg.languages)

  STEP 4 — Execute query
    SELECT
      cg.id              AS caregiver_id,
      u.name,
      cg.avg_rating,
      cg.total_reviews,
      cg.hourly_rate,
      cg.years_experience,
      cg.care_types,
      cg.languages,
      cg.service_radius_km,
      [Haversine expression] AS distance_km
    FROM   caregivers cg
    JOIN   users u ON cg.user_id = u.id
    WHERE  [dynamic conditions]
    ORDER  BY [sort expression]
    LIMIT  ${limit}

  STEP 5 — Compute estimatedArrivalMinutes per result
    Assume average travel speed of 30 km/h for walking/city driving:
      estimatedArrivalMinutes = Math.round((row.distance_km / 30) * 60)
    Clamp minimum to 1 minute.

  STEP 6 — Return 200:
    {
      success: true,
      data: {
        caregivers: Array<{
          caregiverId:              number,
          name:                     string,
          avgRating:                number,
          totalReviews:             number,
          hourlyRate:               number,
          yearsExperience:          number,
          careTypes:                string[],
          languages:                string[],
          distanceKm:               number,    // rounded to 2dp
          estimatedArrivalMinutes:  number,
        }>,
        total:     number,
        radiusKm:  number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Never expose caregiver current_lat/lng in the response
  - distance_km must be rounded to 2 decimal places: Math.round(d * 100) / 100
  - SORT_MAP is the single source of truth — no inline ORDER BY strings
  - Dynamic WHERE must use parameterized values — never string concatenation
  - Caregivers with service_radius_km < distance_km are excluded even if
    within the requested radius (LEAST ensures mutual coverage)
  - Add TODO comment: replace estimated arrival with Google Distance Matrix
    API call when per-session ETA accuracy is required
*/
import { NextResponse } from "next/server";
import { requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

const SORT_MAP: Record<string, string> = {
  nearest: "distance_km ASC",
  highest_rated: "cg.avg_rating DESC",
  lowest_price: "cg.hourly_rate ASC",
  fastest_arrival: "distance_km ASC",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  const radius = parseFloat(params.get("radius_km") ?? "20");

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return new NextResponse(
      JSON.stringify({
        error: "Valid lat (-90 to 90) and lng (-180 to 180) are required",
      }),
      { status: 400 },
    );
  }

  const careType = params.get("care_type");
  const minRating = params.get("min_rating")
    ? parseFloat(params.get("min_rating") as string)
    : null;
  const maxRate = params.get("max_rate")
    ? parseFloat(params.get("max_rate") as string)
    : null;
  const language = params.get("language");

  const sortKey = params.get("sort") ?? "nearest";
  const orderExpr = SORT_MAP[sortKey] ?? SORT_MAP.nearest;

  const limit = Math.min(parseInt(params.get("limit") ?? "20", 10) || 20, 50);

  await requireRelative(request);

  const haversine = `(
    6371.0 * ACOS(
      LEAST(1.0,
        COS(RADIANS(${lat}::float)) *
        COS(RADIANS(cg.current_lat::float)) *
        COS(RADIANS(cg.current_lng::float) - RADIANS(${lng}::float)) +
        SIN(RADIANS(${lat}::float)) *
        SIN(RADIANS(cg.current_lat::float))
      )
    )
  )`;

  // Main query: returns limited caregiver rows with computed distance
  const rows = await db<any>`
    SELECT
      cg.id                AS caregiver_id,
      u.name               AS name,
      cg.avg_rating::FLOAT AS avg_rating,
      cg.total_reviews     AS total_reviews,
      cg.hourly_rate::FLOAT AS hourly_rate,
      cg.years_experience  AS years_experience,
      cg.care_types        AS care_types,
      cg.languages         AS languages,
      cg.service_radius_km AS service_radius_km,
      ${haversine} AS distance_km
    FROM caregivers cg
    JOIN users u ON cg.user_id = u.id
    WHERE cg.is_available = ${true}
      AND cg.current_lat IS NOT NULL
      AND cg.current_lng IS NOT NULL
      AND (${haversine}) <= LEAST(${radius}, cg.service_radius_km)
      AND (${careType}::text IS NULL OR ${careType} = ANY(cg.care_types))
      AND (${minRating}::float IS NULL OR cg.avg_rating >= ${minRating})
      AND (${maxRate}::float IS NULL OR cg.hourly_rate <= ${maxRate})
      AND (${language}::text IS NULL OR ${language} = ANY(cg.languages))
    ORDER BY
      CASE
        WHEN ${sortKey} = 'nearest' THEN ${haversine}
        WHEN ${sortKey} = 'highest_rated' THEN cg.avg_rating * -1
        WHEN ${sortKey} = 'lowest_price' THEN cg.hourly_rate
        ELSE ${haversine}
      END
    LIMIT ${limit}
  `;

  // Count query using same filters
  const countRows = await db<{ total: number }>`
    SELECT COUNT(*)::INT AS total
    FROM caregivers cg
    WHERE cg.is_available = ${true}
      AND cg.current_lat IS NOT NULL
      AND cg.current_lng IS NOT NULL
      AND (${haversine}) <= LEAST(${radius}, cg.service_radius_km)
      AND (${careType}::text IS NULL OR ${careType} = ANY(cg.care_types))
      AND (${minRating}::float IS NULL OR cg.avg_rating >= ${minRating})
      AND (${maxRate}::float IS NULL OR cg.hourly_rate <= ${maxRate})
      AND (${language}::text IS NULL OR ${language} = ANY(cg.languages))
  `;

  const total = countRows?.[0]?.total ?? 0;

  const caregivers = (rows || []).map((r: any) => {
    const distance =
      typeof r.distance_km === "number"
        ? r.distance_km
        : parseFloat(r.distance_km);
    const rounded = Math.round((distance || 0) * 100) / 100;
    const eta = Math.max(1, Math.round(((distance || 0) / 30) * 60));

    return {
      caregiverId: r.caregiver_id,
      name: r.name,
      avgRating: r.avg_rating ?? null,
      totalReviews: r.total_reviews ?? 0,
      hourlyRate: r.hourly_rate ?? null,
      yearsExperience: r.years_experience ?? 0,
      careTypes: r.care_types ?? [],
      languages: r.languages ?? [],
      distanceKm: rounded,
      estimatedArrivalMinutes: eta,
    };
  });

  return NextResponse.json({
    success: true,
    data: { caregivers, total, radiusKm: radius },
  });
}
