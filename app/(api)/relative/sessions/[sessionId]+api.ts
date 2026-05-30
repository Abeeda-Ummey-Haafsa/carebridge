import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const { user } = await requireRelative(request);

    const rows = await db<any>`
      SELECT cs.*, cg.bio, cg.years_experience, cg.care_types, cg.languages, cg.avg_rating,
             cu.name AS caregiver_name,
             eu.name AS elder_name,
             e.mobility_level, e.allergies, e.preferred_languages
      FROM care_sessions cs
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      JOIN users cu ON cg.user_id = cu.id
      JOIN elders e ON cs.elder_id = e.id
      JOIN users eu ON e.user_id = eu.id
      WHERE cs.id = ${sessionId}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = rows[0];

    await requireRelativeOwnership(user.id, session.elder_id);

    const [notes, tasks, payments, reviews] = await Promise.all([
      db<any>`
        SELECT sn.id, sn.content, sn.note_type, sn.created_at, u.name AS author_name
        FROM session_notes sn
        JOIN users u ON sn.author_user_id = u.id
        WHERE sn.session_id = ${sessionId}
        ORDER BY sn.created_at DESC
      `,
      db<any>`
        SELECT id, task_name, is_completed, notes, is_custom, sort_order, completed_at
        FROM session_tasks
        WHERE session_id = ${sessionId}
        ORDER BY sort_order ASC, created_at ASC
      `,
      db<any>`
        SELECT id, amount, status, currency, paid_at
        FROM payments
        WHERE session_id = ${sessionId}
        LIMIT 1
      `,
      db<any>`
        SELECT id, rating, comment, created_at
        FROM reviews
        WHERE session_id = ${sessionId}
        LIMIT 1
      `,
    ]);

    const completedTasks = (tasks || []).filter(
      (t: any) => t.is_completed,
    ).length;
    const totalTasks = (tasks || []).length;

    const checkedIn = session.checked_in_at
      ? new Date(session.checked_in_at)
      : null;
    const checkedOut = session.checked_out_at
      ? new Date(session.checked_out_at)
      : null;
    const actualDurationMinutes =
      checkedIn && checkedOut
        ? Math.round((checkedOut.getTime() - checkedIn.getTime()) / 60000)
        : null;

    return Response.json({
      success: true,
      data: {
        session: {
          sessionId: session.id,
          careType: session.care_type,
          status: session.status,
          scheduledAt: session.scheduled_at,
          durationMinutes: session.duration_minutes,
          hourlyRate: session.hourly_rate,
          totalCost: session.total_cost,
          checkedInAt: session.checked_in_at,
          checkedOutAt: session.checked_out_at,
          actualDurationMinutes,
          elderAddress: session.elder_address,
        },
        caregiver: {
          caregiverId: session.caregiver_id,
          caregiverName: session.caregiver_name,
          bio: session.bio ?? null,
          yearsExperience: session.years_experience ?? 0,
          careTypes: session.care_types ?? [],
          languages: session.languages ?? [],
          avgRating: session.avg_rating ?? null,
        },
        elder: {
          elderName: session.elder_name,
          mobilityLevel: session.mobility_level ?? null,
          allergies: session.allergies ?? null,
          preferredLanguages: session.preferred_languages ?? [],
        },
        notes: notes || [],
        tasks: {
          items: tasks || [],
          total: totalTasks,
          completed: completedTasks,
        },
        payment: payments?.[0] ?? null,
        review: reviews?.[0] ?? null,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error("[relative/sessions/:id] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions/[sessionId]+api.ts
  PURPOSE: GET /api/relative/sessions/:sessionId
           Returns full session detail for the Session Details Modal
           (Section 7) in the Sessions screen. Aggregates session core,
           caregiver info, elder info, notes, tasks, payment, and review.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function GET(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions   (all columns)
  TABLE caregivers      (bio, hourly_rate, years_experience, care_types,
                         languages, avg_rating)
  TABLE users           (caregiver and elder names)
  TABLE elders          (mobility_level, allergies, preferred_languages)
  TABLE session_notes   (full notes list)
  TABLE session_tasks   (full task list with completion state)
  TABLE payments        (payment record if exists)
  TABLE reviews         (review if exists, UNIQUE on session_id)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Fetch session + verify ownership
    SELECT cs.*, cg.bio, cg.years_experience, cg.care_types,
           cg.languages, cg.avg_rating,
           cu.name AS caregiver_name,
           eu.name AS elder_name,
           e.mobility_level, e.allergies, e.preferred_languages
    FROM   care_sessions cs
    JOIN   caregivers cg ON cs.caregiver_id = cg.id
    JOIN   users      cu ON cg.user_id      = cu.id
    JOIN   elders     e  ON cs.elder_id     = e.id
    JOIN   users      eu ON e.user_id       = eu.id
    WHERE  cs.id = ${sessionId}
    LIMIT  1
    404 if not found.
    requireRelativeOwnership(user.id, session.elder_id) → 403 if fails.

  STEP 4 — Run remaining queries in parallel with Promise.all():

    QUERY A — Session notes (all, newest first)
      SELECT sn.id, sn.content, sn.note_type, sn.created_at,
             u.name AS author_name
      FROM   session_notes sn
      JOIN   users u ON sn.author_user_id = u.id
      WHERE  sn.session_id = ${sessionId}
      ORDER  BY sn.created_at DESC

    QUERY B — Session tasks (all, ordered)
      SELECT id, task_name, is_completed, notes, is_custom,
             sort_order, completed_at
      FROM   session_tasks
      WHERE  session_id = ${sessionId}
      ORDER  BY sort_order ASC, created_at ASC

    QUERY C — Payment record
      SELECT id, amount, status, currency, paid_at
      FROM   payments
      WHERE  session_id = ${sessionId}
      LIMIT  1

    QUERY D — Review record
      SELECT id, rating, comment, created_at
      FROM   reviews
      WHERE  session_id = ${sessionId}
      LIMIT  1

  STEP 5 — Compute task summary
    const completedTasks = tasks.filter(t => t.is_completed).length
    const totalTasks = tasks.length

  STEP 6 — Return 200:
    {
      success: true,
      data: {
        session: {
          sessionId, careType, status, scheduledAt, durationMinutes,
          hourlyRate, totalCost, checkedInAt, checkedOutAt,
          actualDurationMinutes, elderAddress,
        },
        caregiver: {
          caregiverId, caregiverName, bio, yearsExperience, careTypes,
          languages, avgRating,
        },
        elder: {
          elderName, mobilityLevel, allergies, preferredLanguages,
        },
        notes:   NoteRow[],
        tasks: {
          items:     TaskRow[],
          total:     number,
          completed: number,
        },
        payment: PaymentRow | null,
        review:  ReviewRow | null,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - requireRelativeOwnership MUST run before any sensitive data is returned
  - Run all 4 parallel queries with Promise.all — never sequentially
  - payment and review return null (not 404) when not yet created
  - Do NOT return caregiver user_id or internal IDs beyond caregiverId
*/
