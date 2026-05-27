import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";

interface CheckOutResponse {
  success: boolean;
  data: {
    session_id: number;
    status: string;
    checked_out_at: string;
    actual_duration_minutes: number;
    total_cost: number;
    payment_id: number;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: Parse and validate sessionId
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: Authenticate caregiver
    const { caregiver, user } = await requireCaregiver(request);

    // Step 3: Fetch session
    const sessions = await db<any>`
      SELECT id, caregiver_id, elder_id, booked_by_user_id, status,
             hourly_rate, duration_minutes, checked_in_at
      FROM care_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessions[0];

    if (session.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 4: Status guard
    if (session.status !== "checked_in" && session.status !== "paused") {
      return Response.json(
        {
          error: "Session must be checked in or paused to check out",
          current_status: session.status,
        },
        { status: 409 },
      );
    }

    // Step 5: Computations
    let actualMinutes = Number(session.duration_minutes);
    if (session.checked_in_at) {
      const checkedInMs = new Date(session.checked_in_at).getTime();
      const checkedOutMs = Date.now();
      actualMinutes = Math.max(
        0,
        Math.ceil((checkedOutMs - checkedInMs) / 60000),
      );
    }

    const hours = actualMinutes / 60;
    const hourlyRate = Number(session.hourly_rate) || 0;
    const totalCost = parseFloat((hours * hourlyRate).toFixed(2));

    // TODO: Replace this placeholder with a real Stripe PaymentIntent ID when Stripe is integrated.
    const stripePaymentIntentId = `pi_pending_${sessionId}_${Date.now()}`;

    // Step 6: UPDATE care_sessions
    const updatedSessions = await db<any>`
      UPDATE care_sessions
      SET
        status = 'completed',
        checked_out_at = NOW(),
        actual_duration_minutes = ${actualMinutes},
        total_cost = ${totalCost},
        updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id, status, checked_out_at, actual_duration_minutes, total_cost
    `;
    const updatedSession = updatedSessions[0];

    // Step 7: INSERT payments row
    const payments = await db<any>`
      INSERT INTO payments
        (session_id, payer_user_id, stripe_payment_intent_id, amount, currency, status)
      VALUES
        (${sessionId}, ${session.booked_by_user_id},
         ${stripePaymentIntentId},
         ${totalCost}, 'usd', 'pending')
      RETURNING id
    `;
    const payment = payments[0];

    // Step 8: INSERT system message
    await db`
      INSERT INTO messages (session_id, sender_user_id, content, message_type, is_read)
      VALUES (${sessionId}, ${user.id}, 'Session completed', 'system', false)
    `;

    // Step 9: NOTIFY RELATIVE (fire-and-forget)
    (async () => {
      try {
        const title = "Care Session Completed";
        const bodyText = `Session finished. Total: $${totalCost.toFixed(2)}`;

        // Insert notification
        await db`
          INSERT INTO notifications (user_id, title, body, type, related_id, related_type)
          VALUES (${session.booked_by_user_id}, ${title}, ${bodyText}, 'session_update', ${sessionId}, 'care_session')
        `;

        // Fetch tokens
        const tokens = await db<{ token: string }>`
          SELECT token FROM device_tokens WHERE user_id = ${session.booked_by_user_id}
        `;

        if (tokens.length > 0) {
          const pushPayloads = tokens.map((t) => ({
            to: t.token,
            title,
            body: bodyText,
            data: { session_id: sessionId, type: "session_update" },
          }));

          // Send to expo
          for (const payload of pushPayloads) {
            await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            }).catch((e) =>
              console.error("[check-out] Expo push send error:", e),
            );
          }
        }
      } catch (notifyErr) {
        console.error("[check-out] Notification error:", notifyErr);
      }
    })();

    // Step 10: Return 200
    const responsePayload: CheckOutResponse = {
      success: true,
      data: {
        session_id: updatedSession.id,
        status: updatedSession.status,
        checked_out_at: updatedSession.checked_out_at,
        actual_duration_minutes: updatedSession.actual_duration_minutes,
        total_cost: updatedSession.total_cost,
        payment_id: payment.id,
      },
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (err) {
    if (err instanceof ApiAuthError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[check-out POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
