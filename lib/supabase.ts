import { createClient } from "@supabase/supabase-js";

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL is not set");
}
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY is not set");
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export async function broadcastEvent(
  channelName: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const channel = supabase.channel(channelName);
  await channel.send({ type: "broadcast", event, payload });
  await supabase.removeChannel(channel);
}
