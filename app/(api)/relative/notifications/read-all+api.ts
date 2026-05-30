/*
  FILE: app/(api)/relative/notifications/read-all+api.ts
  PURPOSE: PATCH /api/relative/notifications/read-all
           Marks ALL unread notifications for the relative as read.
           Called when the notifications screen is fully viewed.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 2 — UPDATE notifications
    SET    is_read = true
    WHERE  user_id = ${user.id}
      AND  is_read = false
    RETURNING COUNT(*) is not available in RETURNING — use rowCount from driver.

  STEP 3 — Return 200:
    {
      success: true,
      data: { markedRead: number }
    }
    markedRead = number of rows updated (use result.rowCount from pg driver).

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - This is idempotent — safe to call when all notifications already read
  - markedRead = 0 is a valid success (nothing to mark)
  - Do NOT use RETURNING * — use pg driver's rowCount for the update count
*/
