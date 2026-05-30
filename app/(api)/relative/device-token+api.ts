import { ApiAuthError, requireAuth } from "@/lib/server-auth";
import { db } from "@/lib/db";

interface DeviceTokenBody {
  token?: unknown;
  platform?: unknown;
}

function parseBody(body: unknown): DeviceTokenBody {
  if (typeof body === "object" && body !== null) {
    return body as DeviceTokenBody;
  }

  return {};
}

function isValidPlatform(platform: unknown): platform is "ios" | "android" {
  return platform === "ios" || platform === "android";
}

export async function POST(request: Request) {
  try {
    const body = parseBody(await request.json());
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const platform = body.platform;

    if (!token || !isValidPlatform(platform)) {
      return Response.json(
        { error: "token and platform (ios|android) are required" },
        { status: 400 },
      );
    }

    const { user } = await requireAuth(request);

    await db<{ id: number }>`
      INSERT INTO device_tokens (user_id, token, platform)
      VALUES (${user.id}, ${token}, ${platform})
      ON CONFLICT (user_id, token) DO NOTHING
      RETURNING id
    `;

    return Response.json({
      success: true,
      data: { registered: true },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = parseBody(await request.json());
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return Response.json({ error: "token is required" }, { status: 400 });
    }

    const { user } = await requireAuth(request);

    await db`
      DELETE FROM device_tokens
      WHERE user_id = ${user.id}
      AND token = ${token}
    `;

    return Response.json({
      success: true,
      data: { removed: true },
    });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
