import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const { user } = await requireCaregiver(request);

    // Client MUST implement a 3-second auto-clear timeout after the last
    // typing event received.
    const channel = supabase.channel(`session:${sessionId}`);
    await channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        name: user.name,
        role: "caregiver",
        timestamp: new Date().toISOString(),
      },
    });

    return Response.json({
      success: true,
      data: { delivered: true },
    });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return Response.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST typing error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
