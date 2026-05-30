import {
  ApiAuthError,
  getRelativeElderIds,
  requireRelative,
} from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { user } = await requireRelative(request);
    const elderIds = await getRelativeElderIds(user.id);

    if (elderIds.length === 0) {
      return Response.json(
        {
          success: true,
          data: {
            totalCareHoursThisWeek: 0,
            completedSessionsCount: 0,
            activeSessionCount: 0,
            upcomingBookingsCount: 0,
            averageCaregiverRating: 0,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const [metricsRows, ratingRows] = await Promise.all([
      db<{
        completed_count: number;
        active_count: number;
        upcoming_count: number;
        weekly_care_minutes: number;
      }>`
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'completed'
          )::INT AS completed_count,
          COUNT(*) FILTER (
            WHERE status IN ('arriving','checked_in','paused')
          )::INT AS active_count,
          COUNT(*) FILTER (
            WHERE status IN ('pending','accepted')
              AND scheduled_at > NOW()
          )::INT AS upcoming_count,
          COALESCE(
            SUM(actual_duration_minutes) FILTER (
              WHERE status = 'completed'
                AND scheduled_at >= CURRENT_DATE - INTERVAL '7 days'
            ), 0
          )::INT AS weekly_care_minutes
        FROM care_sessions
        WHERE elder_id = ANY(${elderIds}::int[])
      `,
      db<{ avg_rating: number }>`
        SELECT COALESCE(AVG(rating), 0)::FLOAT AS avg_rating
        FROM   reviews
        WHERE  reviewer_user_id = ${user.id}
      `,
    ]);

    const metricsRow = metricsRows[0] ?? {
      completed_count: 0,
      active_count: 0,
      upcoming_count: 0,
      weekly_care_minutes: 0,
    };
    const ratingRow = ratingRows[0] ?? { avg_rating: 0 };

    const totalCareHoursThisWeek = parseFloat(
      (metricsRow.weekly_care_minutes / 60).toFixed(1),
    );

    return Response.json(
      {
        success: true,
        data: {
          totalCareHoursThisWeek,
          completedSessionsCount: metricsRow.completed_count,
          activeSessionCount: metricsRow.active_count,
          upcomingBookingsCount: metricsRow.upcoming_count,
          averageCaregiverRating: ratingRow.avg_rating,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
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
