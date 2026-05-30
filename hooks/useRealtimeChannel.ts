import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeChannel(
  channelName: string,
  eventHandlers: Record<string, (payload: Record<string, unknown>) => void>,
  enabled = true,
): void {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase.channel(channelName);

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      channel.on("broadcast", { event }, ({ payload }) => {
        handler(payload as Record<string, unknown>);
      });
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // Only re-subscribe when channelName or enabled change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled]);
}
