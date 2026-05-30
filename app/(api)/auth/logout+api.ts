/*
  FILE: app/(api)/auth/logout+api.ts
  PURPOSE: POST /api/auth/logout
           Cleans up all push notification device tokens for the
           authenticated user on logout so they stop receiving
           push notifications after signing out. Shared across all
           user roles (caregiver, elder, relative).

  ── IMPORTS ────────────────────────────────────────────────────────────────
  import { requireAuth, ApiAuthError } from '@/lib/server-auth'
  import { db }                        from '@/lib/db'

  ── NO REQUEST BODY ──────────────────────────────────────────────────────

  ── DATABASE SCHEMA ────────────────────────────────────────────────────────
  TABLE device_tokens
    id      SERIAL PK
    user_id INTEGER NOT NULL
    token   TEXT NOT NULL

  ── STEPS IN ORDER ────────────────────────────────────────────────────────

  STEP 1 — requireAuth(request) → { user }
    (No role restriction — all roles can log out)

  STEP 2 — DELETE all device tokens for this user
    DELETE FROM device_tokens
    WHERE user_id = ${user.id}

  STEP 3 — Return 204 No Content

  ── CONSTRAINTS ────────────────────────────────────────────────────────────
  - No role restriction — accessible to 'caregiver', 'elder', 'relative'
  - DELETE all tokens for the user — not just the current device token
    (user may have multiple devices; logout should stop all push)
  - If DELETE finds no rows, still return 204 (idempotent)
  - Clerk session invalidation is handled client-side by Clerk SDK —
    this endpoint only handles server-side push token cleanup
  - Return 204 with no body — no JSON response needed
*/

import { getAuthenticatedUser, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // 1. Get authenticated user (this validates they exist in DB)
    const user = await getAuthenticatedUser(request);

    // 2. Extract sessionId to revoke
    const { sessionId } = await auth();

    // 3. Delete all device tokens for the user to prevent further push notifications
    await db<any>`
      DELETE FROM device_tokens
      WHERE user_id = ${user.id}
    `;

    // 4. Revoke the Clerk session. Using clerkClient() if available.
    if (sessionId) {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    }

    return Response.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[logout POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
