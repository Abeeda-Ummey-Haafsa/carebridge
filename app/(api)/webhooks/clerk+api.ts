import { db, sql } from "@/lib/db";
import { Webhook } from "svix";

// Clerk secret for webhook verification
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const headers = {
      "svix-id": request.headers.get("svix-id") as string,
      "svix-timestamp": request.headers.get("svix-timestamp") as string,
      "svix-signature": request.headers.get("svix-signature") as string,
    };

    // Verify webhook signature (only if secret is provided/enforced)
    if (webhookSecret) {
      const wh = new Webhook(webhookSecret);
      try {
        wh.verify(payload, headers);
      } catch (err) {
        return Response.json(
          { error: "Invalid webhook signature" },
          { status: 400 },
        );
      }
    }

    const evt = JSON.parse(payload);
    const eventType = evt.type;

    if (eventType === "user.deleted") {
      const clerkId = evt.data.id;

      if (!clerkId) {
        return Response.json(
          { error: "Missing clerk_id in webhook payload" },
          { status: 400 },
        );
      }

      // Resolve clerk_id -> internal user_id
      const users = await db<{ id: number }>`
        SELECT id FROM users WHERE clerk_id = ${clerkId} LIMIT 1
      `;

      if (users.length > 0) {
        const userId = users[0].id;

        // Perform cleanup in a batch transaction
        const queries = [
          // 1. Delete all related device tokens
          sql`DELETE FROM device_tokens WHERE user_id = ${userId}`,
          // 2. Mark caregiver as unavailable
          sql`UPDATE caregivers SET is_available = false WHERE user_id = ${userId}`,
        ];

        await sql.transaction(queries);
        console.log(
          `[Clerk Webhook] Cleanup completed for deleted user ${userId} (clerk_id: ${clerkId})`,
        );
      }
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[Clerk Webhook POST]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
