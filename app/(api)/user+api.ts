import { neon } from "@neondatabase/serverless";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerkId, role } = await request.json();

    if (!name || !email || !clerkId || !role) {
      return jsonResponse(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["caregiver", "elder", "relative"].includes(role)) {
      return jsonResponse(
        { error: "Invalid role. Must be 'caregiver', 'elder', or 'relative'" },
        { status: 400 },
      );
    }

    const response = await sql`
      INSERT INTO users (
        clerk_id,
        email,
        name,
        role
      )
      VALUES (
        ${clerkId},
        ${email},
        ${name},
        ${role}
      )
      ON CONFLICT (clerk_id) DO NOTHING
      RETURNING id, clerk_id, email, name, role, created_at;
    `;

    if (response.length === 0) {
      return jsonResponse({ error: "User already exists" }, { status: 409 });
    }

    return jsonResponse({ data: response[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return jsonResponse({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("clerkId");
    const email = url.searchParams.get("email");

    if (!clerkId && !email) {
      return jsonResponse(
        { error: "Missing clerkId or email parameter" },
        { status: 400 },
      );
    }

    const response = clerkId
      ? await sql`
          SELECT id, clerk_id, email, name, role, created_at FROM users WHERE clerk_id = ${clerkId};
        `
      : await sql`
          SELECT id, clerk_id, email, name, role, created_at FROM users WHERE email = ${email};
        `;

    if (response.length === 0) {
      return jsonResponse({ error: "User not found" }, { status: 404 });
    }

    return jsonResponse({ data: response[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return jsonResponse({ error: "Internal Server Error" }, { status: 500 });
  }
}
