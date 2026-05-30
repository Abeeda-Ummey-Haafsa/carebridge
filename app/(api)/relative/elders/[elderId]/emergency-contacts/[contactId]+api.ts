/*
  FILE: app/(api)/relative/elders/[elderId]/emergency-contacts/[contactId]+api.ts
  PURPOSE: DELETE /api/relative/elders/:elderId/emergency-contacts/:contactId
           Removes a single emergency contact. Verifies the contact
           belongs to the given elder before deleting.

  ── EXPO ROUTER PARAM EXTRACTION ──────────────────────────────────────────
  export async function DELETE(
    request: Request,
    { params }: { params: { elderId: string; contactId: string } }
  )
  elderId   = parseInt(params.elderId, 10)
  contactId = parseInt(params.contactId, 10)
  If either NaN → 400.

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — Parse params

  STEP 2 — requireAuth(request) → { user }
             requireRole(user, 'relative')
             requireRelativeOwnership(user.id, elderId)

  STEP 3 — Verify contact belongs to elder
    SELECT id FROM elder_emergency_contacts
    WHERE  id = ${contactId} AND elder_id = ${elderId}
    404 if not found.

  STEP 4 — DELETE
    DELETE FROM elder_emergency_contacts
    WHERE id = ${contactId}

  STEP 5 — Return 204 No Content

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - MUST verify contactId belongs to elderId before delete (STEP 3)
    — prevents deleting another elder's contacts
  - Return 204 with no body on success
*/
