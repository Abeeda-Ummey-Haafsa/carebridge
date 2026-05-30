/*
  FILE: app/(api)/relative/notification-preferences+api.ts
  PURPOSE: GET + PATCH /api/relative/notification-preferences
           Returns and updates the relative's notification settings.
           Stored as a JSONB column on the users table (add if missing)
           or in a separate table — use users table JSONB for simplicity.

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, requireRole, ApiAuthError } from '@/lib/server-auth'
  import { db }                                     from '@/lib/db'

  ── DEFAULT PREFERENCES ──────────────────────────────────────────────────
  const DEFAULT_PREFERENCES = {
    sessionUpdates:          true,
    caregiverMessages:       true,
    emergencyAlerts:         true,
    bookingReminders:        true,
    paymentNotifications:    true,
    caregiverArrivalAlerts:  true,
  }

  ── DATABASE NOTE ─────────────────────────────────────────────────────────
  Add a notification_preferences JSONB column to users table:
    ALTER TABLE users ADD COLUMN IF NOT EXISTS
      notification_preferences JSONB DEFAULT '{}';
  Add this comment at the top of the file.

  ── GET STEPS ─────────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 2 — SELECT notification_preferences FROM users WHERE id = ${user.id}
             Merge with DEFAULT_PREFERENCES:
               const prefs = { ...DEFAULT_PREFERENCES,
                                ...(row.notification_preferences ?? {}) }

  STEP 3 — Return 200: { success: true, data: { preferences: prefs } }

  ── PATCH STEPS ───────────────────────────────────────────────────────────

  PATCH body: Partial
  Validate: all provided values must be boolean. Return 400 if not.

  STEP 1 — Parse + validate body

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')

  STEP 3 — Fetch current preferences (same as GET STEP 2)

  STEP 4 — Merge incoming with current:
    const updatedPrefs = { ...currentPrefs, ...body }

  STEP 5 — UPDATE users
    SET notification_preferences = ${JSON.stringify(updatedPrefs)}::jsonb
    WHERE id = ${user.id}

  STEP 6 — Return 200: { success: true, data: { preferences: updatedPrefs } }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - Merge with defaults on every GET — never return null preferences
  - PATCH is a MERGE (not replace) — only update provided fields
  - Validate all body values are boolean — reject strings/numbers
  - Cast to ::jsonb in UPDATE for correct Postgres type
*/
