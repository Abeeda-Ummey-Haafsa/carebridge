import { getAuthenticatedUser, ApiAuthError } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { auth, clerkClient } from '@clerk/nextjs/server';

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

    return Response.json({ success: true, message: "Logged out successfully" }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[logout POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
