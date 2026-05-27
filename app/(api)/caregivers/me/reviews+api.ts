import { requireCaregiver, getAuthenticatedUser, ApiAuthError } from '@/lib/server-auth';
import { db, sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { caregiver } = await requireCaregiver(request);
    
    // Pagination params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const [reviews, statsRows] = await Promise.all([
      db<any>`
        SELECT r.*, u.name as reviewer_name
        FROM reviews r
        JOIN users u ON r.reviewer_user_id = u.id
        WHERE r.caregiver_id = ${caregiver.id}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      // Get the rating breakdown
      db<any>`
        SELECT rating, CAST(COUNT(*) AS INTEGER) as count
        FROM reviews
        WHERE caregiver_id = ${caregiver.id}
        GROUP BY rating
      `
    ]);

    // Format histogram
    const breakdown: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    for (const row of statsRows) {
      if (breakdown[row.rating.toString()] !== undefined) {
        breakdown[row.rating.toString()] = row.count;
      }
    }

    return Response.json({
      success: true,
      data: {
        reviews,
        histogram: breakdown,
        pagination: { page, limit }
      }
    }, { status: 200 });

  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[reviews+api GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// NOTE: Usually a relative/elder posts a review, but putting the logic here as requested
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    if (!body.session_id || !body.caregiver_id || typeof body.rating !== 'number') {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Wrap in standard transaction
    const queries = [];
    
    // Insert new review
    queries.push(sql`
      INSERT INTO reviews (session_id, reviewer_user_id, caregiver_id, rating, comment)
      VALUES (${body.session_id}, ${user.id}, ${body.caregiver_id}, ${body.rating}, ${body.comment || null})
    `);

    // Recalculate stats and update caregiver
    queries.push(sql`
      UPDATE caregivers
      SET 
        total_reviews = (
          SELECT CAST(COUNT(*) AS INTEGER) FROM reviews WHERE caregiver_id = ${body.caregiver_id}
        ),
        avg_rating = (
          SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE caregiver_id = ${body.caregiver_id}
        )
      WHERE id = ${body.caregiver_id}
    `);

    await sql.transaction(queries);

    return Response.json({ success: true, message: "Review added and aggregated transactionally" }, { status: 201 });

  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[reviews+api POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
