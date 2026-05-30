import {
  ApiAuthError,
  requireRelative,
  requireRelativeOwnership,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } },
) {
  try {
    const sessionId = parseInt(params.sessionId, 10);
    if (Number.isNaN(sessionId)) {
      return Response.json({ error: "Invalid sessionId" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const rating = Number(body?.rating);
    const comment = body?.comment ? String(body.comment).trim() : null;

    if (!rating || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return Response.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }
    if (comment && comment.length > 2000) {
      return Response.json(
        { error: "comment max length is 2000 characters" },
        { status: 400 },
      );
    }

    const { user } = await requireRelative(request);

    const sessionRows = await db<any>`
      SELECT id, elder_id, caregiver_id, booked_by_user_id, status
      FROM care_sessions WHERE id = ${sessionId}
      LIMIT 1
    `;

    if (!sessionRows || sessionRows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionRows[0];

    await requireRelativeOwnership(user.id, session.elder_id);

    if (session.booked_by_user_id !== user.id) {
      return Response.json(
        { error: "Only the booking relative can review this session" },
        { status: 403 },
      );
    }

    if (session.status !== "completed") {
      return Response.json(
        { error: "Reviews can only be submitted for completed sessions" },
        { status: 409 },
      );
    }

    const existing = await db<{ id: number }>`
      SELECT id FROM reviews WHERE session_id = ${sessionId} LIMIT 1
    `;
    if (existing && existing.length > 0) {
      return Response.json(
        { error: "A review for this session has already been submitted" },
        { status: 409 },
      );
    }

    const inserted = await db<any>`
      INSERT INTO reviews (session_id, reviewer_user_id, caregiver_id, rating, comment)
      VALUES (${sessionId}, ${user.id}, ${session.caregiver_id}, ${rating}, ${comment})
      RETURNING id, rating, created_at
    `;

    const review = inserted[0];

    // Update caregiver rolling average
    const caregiverStats = await db<{
      avg_rating: number;
      total_reviews: number;
    }>`
      SELECT avg_rating::FLOAT, total_reviews FROM caregivers WHERE id = ${session.caregiver_id} LIMIT 1
    `;

    const existingAvg = caregiverStats?.[0]?.avg_rating ?? 0;
    const existingCount = caregiverStats?.[0]?.total_reviews ?? 0;
    const newTotal = existingCount + 1;
    const newAvgRaw = (existingAvg * existingCount + rating) / newTotal;
    const newAvg = parseFloat(newAvgRaw.toFixed(2));

    await db`
      UPDATE caregivers
      SET avg_rating = ${newAvg}, total_reviews = ${newTotal}
      WHERE id = ${session.caregiver_id}
    `;

    // Fire-and-forget push notification to caregiver
    void (async () => {
      try {
        const relUserRows = await db<{ name: string }>`
          SELECT name FROM users WHERE id = ${user.id} LIMIT 1
        `;
        const relName = relUserRows?.[0]?.name ?? "A relative";

        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES ((SELECT user_id FROM caregivers WHERE id = ${session.caregiver_id}), ${"New Review"}, ${relName + " left you a " + String(rating) + "-star review"}, ${"review_received"}, ${review.id}, ${"review"})
        `;

        const caregiverUserIdRows = await db<{ user_id: number }>`
          SELECT user_id FROM caregivers WHERE id = ${session.caregiver_id} LIMIT 1
        `;
        const caregiverUserId = caregiverUserIdRows?.[0]?.user_id;

        if (caregiverUserId) {
          const tokens = await db<{ token: string }>`
            SELECT token FROM device_tokens WHERE user_id = ${caregiverUserId}
          `;
          if (tokens.length > 0) {
            const messages = tokens.map((t) => ({
              to: t.token,
              title: "New Review",
              body: `${relName} left you a ${rating}-star review`,
              data: { review_id: review.id, type: "review_received" },
            }));

            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(messages),
            });
          }
        }
      } catch (err) {
        console.error("[relative/review notify] failed", err);
      }
    })();

    return Response.json(
      {
        success: true,
        data: {
          reviewId: review.id,
          rating: review.rating,
          createdAt: review.created_at,
          newAvgRating: newAvg,
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
    console.error("[relative/sessions review] error", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
/*
  FILE: app/(api)/relative/sessions/[sessionId]/review+api.ts
  PURPOSE: POST /api/relative/sessions/:sessionId/review
           Creates a review for a completed session. Enforces the UNIQUE
           constraint (one review per session), then updates the
           caregiver's rolling average rating and total_reviews count.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function POST(
    request: Request,
    { params }: { params: { sessionId: string } }
  )
  sessionId = parseInt(params.sessionId, 10). Return 400 if NaN.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRelative, requireRelativeOwnership, ApiAuthError }
    from '@/lib/server-auth'
  import { db } from '@/lib/db'

  ── REQUEST BODY ──────────────────────────────────────────────────────────
  { rating: number, comment?: string }
  Validate:
    - rating: integer, 1 <= rating <= 5
    - comment: optional string, max 2000 characters
  Return 400 on failure.

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE care_sessions
    id, elder_id, caregiver_id, booked_by_user_id, status

  TABLE reviews   (UNIQUE on session_id)
    id, session_id, reviewer_user_id, caregiver_id, rating, comment,
    created_at

  TABLE caregivers
    id, user_id, avg_rating, total_reviews

  TABLE device_tokens   (for push to caregiver)
  TABLE users           (for relative name in push body)

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse sessionId + validate body

  STEP 2 — requireAuth(request) → { user }
             requireRelative(user, 'relative')

  STEP 3 — Fetch session + verify ownership + status
    SELECT id, elder_id, caregiver_id, booked_by_user_id, status
    FROM   care_sessions WHERE id = ${sessionId}
    404 if not found.
    requireRelativeOwnership(user.id, session.elder_id) → 403
    If booked_by_user_id !== user.id → 403:
      { error: 'Only the booking relative can review this session' }
    If session.status !== 'completed' → 409:
      { error: 'Reviews can only be submitted for completed sessions' }

  STEP 4 — Check for existing review
    SELECT id FROM reviews WHERE session_id = ${sessionId} LIMIT 1
    If found → 409:
      { error: 'A review for this session has already been submitted' }

  STEP 5 — INSERT review
    INSERT INTO reviews (session_id, reviewer_user_id, caregiver_id, rating, comment)
    VALUES (${sessionId}, ${user.id}, ${session.caregiver_id},
            ${body.rating}, ${body.comment ?? null})
    RETURNING id, rating, created_at

  STEP 6 — UPDATE caregiver rolling average (incremental formula)
    First fetch: SELECT avg_rating, total_reviews FROM caregivers WHERE id = session.caregiver_id
    Then:
      const newTotal   = existing.total_reviews + 1
      const newAvgRaw  = ((existing.avg_rating * existing.total_reviews) + body.rating) / newTotal
      const newAvg     = parseFloat(newAvgRaw.toFixed(2))

    UPDATE caregivers
    SET    avg_rating     = ${newAvg},
           total_reviews  = ${newTotal}
    WHERE  id = ${session.caregiver_id}

  STEP 7 — NOTIFY CAREGIVER (fire-and-forget, try/catch)
    Push body: '${user.name} left you a ${body.rating}-star review'
    Fetch caregiver.user_id → fetch device_tokens → send Expo push.
    Type: 'review_received'

  STEP 8 — Return 201:
    {
      success: true,
      data: {
        reviewId:    number,
        rating:      number,
        createdAt:   string,
        newAvgRating: number,
      }
    }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Incremental avg formula: (old_avg * old_count + new_rating) / (old_count + 1)
    avoids full table re-scan
  - Do NOT await STEP 7 — fire-and-forget
  - STEP 4 explicit check is needed even though DB has UNIQUE constraint —
    return 409 with clear user-facing message before hitting DB error
  - newAvg must be clamped to 2 decimal places for consistency
*/
