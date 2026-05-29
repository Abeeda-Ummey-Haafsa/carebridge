import { getAuthenticatedUser, ApiAuthError } from '@/lib/server-auth';
import { db, sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    const { token, platform } = body;

    if (!token || !platform) {
      return Response.json({ error: "Missing required fields: token and platform" }, { status: 400 });
    }

    if (!['ios', 'android'].includes(platform)) {
      return Response.json({ error: "platform must be 'ios' or 'android'" }, { status: 400 });
    }

    const rows = await db<any>`
      INSERT INTO device_tokens (user_id, token, platform)
      VALUES (${user.id}, ${token}, ${platform})
      ON CONFLICT (user_id, token) DO NOTHING
      RETURNING *
    `;

    return Response.json({ success: true, message: "Device token registered" }, { status: 201 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[device-tokens POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
