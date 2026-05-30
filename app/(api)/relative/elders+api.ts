import { ApiAuthError, requireRelative } from "@/lib/server-auth";
import { db, dbTransaction } from "@/lib/db";

type ElderRole =
  | "independent"
  | "walker"
  | "wheelchair"
  | "assisted"
  | "dependent";

const validMobilityLevels = new Set<ElderRole>([
  "independent",
  "walker",
  "wheelchair",
  "assisted",
  "dependent",
]);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseDateOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);

    const rows = await db<{
      elder_id: number;
      name: string;
      email: string | null;
      mobility_level: string | null;
      preferred_languages: string[] | null;
      home_address: string | null;
      home_lat: number | null;
      home_lng: number | null;
      relationship: string | null;
      is_primary: boolean;
      active_session_count: number;
    }>`
      SELECT
        e.id AS elder_id,
        u.name,
        u.email,
        e.mobility_level,
        e.preferred_languages,
        e.home_address,
        e.home_lat,
        e.home_lng,
        erl.relationship,
        erl.is_primary,
        COUNT(cs.id) FILTER (
          WHERE cs.status IN ('arriving','checked_in','paused')
        )::INT AS active_session_count
      FROM   elder_relative_links erl
      JOIN   elders e ON erl.elder_id = e.id
      JOIN   users  u ON e.user_id = u.id
      LEFT JOIN care_sessions cs ON cs.elder_id = e.id
      WHERE  erl.relative_user_id = ${user.id}
      GROUP  BY e.id, u.name, u.email, e.mobility_level,
                e.preferred_languages, e.home_address,
                e.home_lat, e.home_lng,
                erl.relationship, erl.is_primary
      ORDER  BY erl.is_primary DESC, u.name ASC
    `;

    return Response.json({
      success: true,
      data: {
        elders: rows.map((row) => ({
          elderId: row.elder_id,
          name: row.name,
          email: row.email,
          mobilityLevel: row.mobility_level,
          preferredLanguages: row.preferred_languages,
          homeAddress: row.home_address,
          homeLat: row.home_lat,
          homeLng: row.home_lng,
          relationship: row.relationship,
          isPrimary: row.is_primary,
          activeSessionCount: row.active_session_count,
        })),
        total: rows.length,
      },
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

export async function POST(request: Request) {
  try {
    const { user } = await requireRelative(request);
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const mobilityLevel =
      typeof body.mobilityLevel === "string" ? body.mobilityLevel.trim() : null;

    if (!name || name.length > 100 || !email || !isValidEmail(email)) {
      return Response.json(
        { error: "Invalid elder profile data" },
        { status: 400 },
      );
    }

    if (
      mobilityLevel !== null &&
      !validMobilityLevels.has(mobilityLevel as ElderRole)
    ) {
      return Response.json(
        { error: "Invalid elder profile data" },
        { status: 400 },
      );
    }

    const dateOfBirth = parseDateOrNull(body.dateOfBirth);
    const medicalNotes =
      typeof body.medicalNotes === "string"
        ? body.medicalNotes.trim() || null
        : null;
    const allergies =
      typeof body.allergies === "string" ? body.allergies.trim() || null : null;
    const preferredLanguages = Array.isArray(body.preferredLanguages)
      ? body.preferredLanguages.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : null;
    const homeAddress =
      typeof body.homeAddress === "string"
        ? body.homeAddress.trim() || null
        : null;
    const homeLat = typeof body.homeLat === "number" ? body.homeLat : null;
    const homeLng = typeof body.homeLng === "number" ? body.homeLng : null;
    const relationship =
      typeof body.relationship === "string"
        ? body.relationship.trim() || null
        : null;

    const result = await dbTransaction(async (tx) => {
      // TODO: replace when elder onboarding flow is implemented.
      const newUserRows = (await tx`
        INSERT INTO users (name, email, clerk_id, role)
        VALUES (${name}, ${email}, ${`elder_pending_${Date.now()}`}, 'elder')
        RETURNING id
      `) as { id: number }[];

      const newUser = newUserRows[0];

      const newElderRows = (await tx`
        INSERT INTO elders (
          user_id, date_of_birth, medical_notes, allergies,
          mobility_level, preferred_languages,
          home_address, home_lat, home_lng
        )
        VALUES (
          ${newUser.id}, ${dateOfBirth}, ${medicalNotes}, ${allergies},
          ${mobilityLevel}, ${preferredLanguages},
          ${homeAddress}, ${homeLat}, ${homeLng}
        )
        RETURNING id
      `) as { id: number }[];

      const existingLinks = (await tx`
        SELECT COUNT(*)::INT AS existing_count
        FROM   elder_relative_links
        WHERE  relative_user_id = ${user.id}
      `) as { existing_count: number }[];

      const isPrimary = existingLinks[0].existing_count === 0;

      await tx`
        INSERT INTO elder_relative_links
          (elder_id, relative_user_id, relationship, is_primary)
        VALUES
          (${newElderRows[0].id}, ${user.id}, ${relationship}, ${isPrimary})
      `;

      return {
        elderId: newElderRows[0].id,
        name,
        mobilityLevel,
        relationship,
        isPrimary,
      };
    });

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
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
