import { NextResponse } from "next/server";
import { requireRelative } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { caregiverId: string } },
) {
  const caregiverId = parseInt(params.caregiverId, 10);
  if (Number.isNaN(caregiverId)) {
    return new NextResponse(JSON.stringify({ error: "Invalid caregiverId" }), {
      status: 400,
    });
  }

  await requireRelative(request);

  const rows = await db<any>`
		SELECT cg.id, cg.user_id, u.name, cg.bio, cg.hourly_rate::FLOAT AS hourly_rate,
					 cg.years_experience, cg.care_types, cg.languages, cg.avg_rating::FLOAT AS avg_rating,
					 cg.total_reviews, cg.is_available
		FROM caregivers cg
		JOIN users u ON cg.user_id = u.id
		WHERE cg.id = ${caregiverId}
		LIMIT 1
	`;

  if (!rows || rows.length === 0) {
    return new NextResponse(JSON.stringify({ error: "Caregiver not found" }), {
      status: 404,
    });
  }

  const r = rows[0];

  return NextResponse.json({
    success: true,
    data: {
      caregiverId: r.id,
      name: r.name,
      bio: r.bio ?? null,
      hourlyRate: r.hourly_rate ?? null,
      yearsExperience: r.years_experience ?? 0,
      careTypes: r.care_types ?? [],
      languages: r.languages ?? [],
      avgRating: r.avg_rating ?? null,
      totalReviews: r.total_reviews ?? 0,
      isAvailable: !!r.is_available,
    },
  });
}
