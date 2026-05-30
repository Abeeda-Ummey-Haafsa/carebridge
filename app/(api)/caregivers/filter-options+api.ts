/*
  FILE: app/(api)/caregivers/filter-options+api.ts
  PURPOSE: GET /api/caregivers/filter-options
           Returns available filter options derived from live caregiver
           data. Powers the filter modal sliders and chip selectors in
           the Find Care screen (Section 6).

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 2 — Run in parallel with Promise.all():

    QUERY A — Hourly rate range
      SELECT
        MIN(hourly_rate)::FLOAT AS min_rate,
        MAX(hourly_rate)::FLOAT AS max_rate
      FROM caregivers WHERE is_available = true

    QUERY B — Experience range
      SELECT
        MIN(years_experience)::INT AS min_experience,
        MAX(years_experience)::INT AS max_experience
      FROM caregivers WHERE is_available = true

    QUERY C — Distinct care types (unnest array column)
      SELECT DISTINCT UNNEST(care_types) AS care_type
      FROM   caregivers WHERE is_available = true
      ORDER  BY care_type ASC

    QUERY D — Distinct languages
      SELECT DISTINCT UNNEST(languages) AS language
      FROM   caregivers WHERE is_available = true
      ORDER  BY language ASC

  STEP 3 — Return 200:
    {
      success: true,
      data: {
        hourlyRateRange: { min: number, max: number },
        experienceRange: { min: number, max: number },
        careTypes:       string[],
        languages:       string[],
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Only derive options from is_available = true caregivers
    (no point showing filters for unavailable caregivers)
  - UNNEST is the correct way to flatten PostgreSQL TEXT[] columns
  - Return empty arrays for careTypes/languages if no caregivers available
  - All 4 queries run in parallel via Promise.all()
*/
import { NextResponse } from "next/server";
import { requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  await requireRelative(request);

  const [rateRows, expRows, careTypeRows, languageRows] = await Promise.all([
    db<{ min_rate: number | null; max_rate: number | null }>`
      SELECT MIN(hourly_rate)::FLOAT AS min_rate, MAX(hourly_rate)::FLOAT AS max_rate
      FROM caregivers WHERE is_available = ${true}
    `,
    db<{ min_experience: number | null; max_experience: number | null }>`
      SELECT MIN(years_experience)::INT AS min_experience, MAX(years_experience)::INT AS max_experience
      FROM caregivers WHERE is_available = ${true}
    `,
    db<{ care_type: string }>`
      SELECT DISTINCT UNNEST(care_types) AS care_type
      FROM caregivers WHERE is_available = ${true}
      ORDER BY care_type ASC
    `,
    db<{ language: string }>`
      SELECT DISTINCT UNNEST(languages) AS language
      FROM caregivers WHERE is_available = ${true}
      ORDER BY language ASC
    `,
  ]);

  const minRate = rateRows?.[0]?.min_rate ?? null;
  const maxRate = rateRows?.[0]?.max_rate ?? null;

  const minExperience = expRows?.[0]?.min_experience ?? null;
  const maxExperience = expRows?.[0]?.max_experience ?? null;

  const careTypes = (careTypeRows || [])
    .map((r) => r.care_type)
    .filter(Boolean);
  const languages = (languageRows || []).map((r) => r.language).filter(Boolean);

  return NextResponse.json({
    success: true,
    data: {
      hourlyRateRange: { min: minRate, max: maxRate },
      experienceRange: { min: minExperience, max: maxExperience },
      careTypes,
      languages,
    },
  });
}
