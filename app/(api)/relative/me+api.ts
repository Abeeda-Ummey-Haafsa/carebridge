/*
  FILE: app/(api)/relative/me+api.ts
  PURPOSE: GET /api/relative/me
           Returns aggregated profile summary for the Profile screen
           header — identity, counts (elders, sessions, bookings,
           contacts), and a profile completion placeholder.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, getRelativeElderIds, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 2 — const elderIds = await getRelativeElderIds(user.id)

  STEP 3 — Run all aggregations in parallel with Promise.all():

    QUERY A — User base info (already in user object from auth middleware)
      Use user.id, user.name, user.email, user.created_at directly —
      no extra DB query needed.

    QUERY B — Elder count
      SELECT COUNT(*)::INT AS elder_count
      FROM   elder_relative_links
      WHERE  relative_user_id = ${user.id}

    QUERY C — Session counts (active + completed)
      SELECT
        COUNT(*) FILTER (
          WHERE status IN ('arriving','checked_in','paused')
        )::INT AS active_count,
        COUNT(*) FILTER (
          WHERE status = 'completed'
        )::INT AS completed_count
      FROM   care_sessions
      WHERE  elder_id = ANY(${elderIds}::int[])

    QUERY D — Emergency contacts count
      SELECT COUNT(*)::INT AS contact_count
      FROM   elder_emergency_contacts
      WHERE  elder_id = ANY(${elderIds}::int[])

    QUERY E — Payment method exists (boolean check)
      SELECT COUNT(*)::INT AS payment_method_count
      FROM   payment_methods
      WHERE  user_id = ${user.id}

  STEP 4 — Compute profileCompletionPercent (placeholder)
    Criteria:
      - email exists: always true
      - has at least 1 elder linked: elderCount > 0
      - has at least 1 payment method: paymentMethodCount > 0
    Each criterion = 33.3%. Round to nearest integer.

  STEP 5 — Return 200:
    {
      success: true,
      data: {
        id:                       number,
        name:                     string,
        email:                    string,
        createdAt:                string,
        elderCount:               number,
        activeSessionCount:       number,
        completedBookingsCount:   number,
        emergencyContactsCount:   number,
        profileCompletionPercent: number,   // 0, 33, 66, or 100
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Run all DB queries in parallel with Promise.all()
  - profileCompletionPercent is a UI placeholder — exact logic can evolve
  - Do NOT expose clerk_id or auth tokens
  - If elderIds is empty, QUERY C and D return 0 without DB round-trip
*/
import {
  ApiAuthError,
  requireRelative,
  getRelativeElderIds,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const elderIds = await getRelativeElderIds(user.id);

    const [
      elderCountRows,
      sessionCountsRows,
      contactCountRows,
      paymentMethodRows,
      userRow,
    ] = await Promise.all([
      db<{
        elder_count: number;
      }>`SELECT COUNT(*)::INT AS elder_count FROM elder_relative_links WHERE relative_user_id = ${user.id}`,
      elderIds && elderIds.length > 0
        ? db<{ active_count: number; completed_count: number }>`
            SELECT
              COUNT(*) FILTER (WHERE status IN ('arriving','checked_in','paused'))::INT AS active_count,
              COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_count
            FROM care_sessions
            WHERE elder_id = ANY(${elderIds}::int[])
          `
        : Promise.resolve([{ active_count: 0, completed_count: 0 }]),
      elderIds && elderIds.length > 0
        ? db<{
            contact_count: number;
          }>`SELECT COUNT(*)::INT AS contact_count FROM elder_emergency_contacts WHERE elder_id = ANY(${elderIds}::int[])`
        : Promise.resolve([{ contact_count: 0 }]),
      db<{
        payment_method_count: number;
      }>`SELECT COUNT(*)::INT AS payment_method_count FROM payment_methods WHERE user_id = ${user.id}`,
      db<{
        created_at: string;
      }>`SELECT created_at FROM users WHERE id = ${user.id} LIMIT 1`,
    ]);

    const elderCount = elderCountRows?.[0]?.elder_count ?? 0;
    const activeSessionCount = sessionCountsRows?.[0]?.active_count ?? 0;
    const completedBookingsCount = sessionCountsRows?.[0]?.completed_count ?? 0;
    const emergencyContactsCount = contactCountRows?.[0]?.contact_count ?? 0;
    const paymentMethodCount =
      paymentMethodRows?.[0]?.payment_method_count ?? 0;
    const createdAt = userRow?.[0]?.created_at ?? null;

    const criteria = [true, elderCount > 0, paymentMethodCount > 0];
    const profileCompletionPercent = Math.round(
      (criteria.filter(Boolean).length / criteria.length) * 100,
    );

    return Response.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: createdAt ? new Date(createdAt).toISOString() : null,
        elderCount,
        activeSessionCount,
        completedBookingsCount,
        emergencyContactsCount,
        profileCompletionPercent,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/me GET] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length === 0 || name.length > 100) {
      return Response.json(
        { error: "Valid name is required (max 100 chars)" },
        { status: 400 },
      );
    }

    const { user } = await requireRelative(request);

    const rows = await db<{
      id: number;
      name: string;
      email: string;
      created_at: string;
    }>`
      UPDATE users SET name = ${name} WHERE id = ${user.id} RETURNING id, name, email, created_at
    `;

    if (!rows || rows.length === 0) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const u = rows[0];

    return Response.json({
      success: true,
      data: { id: u.id, name: u.name, email: u.email },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/me PATCH] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/*
  NOTE: Add this PATCH handler to the same file as the GET /me handler.

  PURPOSE: PATCH /api/relative/me
           Updates the relative's display name. Email is managed by Clerk
           and cannot be changed here.

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  { name: string }
  Validate:
    - name: non-empty string, max 100 characters
  Return 400 on failure.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse + validate body

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — UPDATE users
    SET    name = ${body.name.trim()}
    WHERE  id   = ${user.id}
    RETURNING id, name, email, created_at

  STEP 4 — Return 200:
    {
      success: true,
      data: {
        id:    number,
        name:  string,
        email: string,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Only 'name' is updatable here — email is Clerk-managed
  - Trim name before update and before validation
  - Do NOT allow empty string names (check after trim)
*/
