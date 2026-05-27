import { getAuthenticatedUser, ApiAuthError } from '@/lib/server-auth';
import { db } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { token } = params;

    if (!token) {
      return Response.json({ error: "Token parameter is missing" }, { status: 400 });
    }

    await db<any>`
      DELETE FROM device_tokens
      WHERE user_id = ${user.id} AND token = ${token}
    `;

    return Response.json({ success: true, message: "Token deleted successfully" }, { status: 200 });

  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[device-tokens DELETE]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
