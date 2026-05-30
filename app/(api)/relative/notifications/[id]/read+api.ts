/*
  FILE: app/(api)/relative/notifications/[id]/read+api.ts
  PURPOSE: PATCH /api/relative/notifications/:id/read
           Marks a single notification as read for the relative.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
  )
  notifId = parseInt(params.id, 10). Return 400 if NaN.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse notifId

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — UPDATE notifications
    SET    is_read = true
    WHERE  id      = ${notifId}
      AND  user_id = ${user.id}   ← ownership enforced in WHERE clause
    If no row updated → 404

  STEP 4 — Return 200:
    { success: true, data: { id: number, isRead: true } }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Ownership enforced via user_id = req.user.id in WHERE — not middleware
  - This is idempotent — marking an already-read notification is safe
  - Return 404 if notification not found OR not owned by this user
*/
