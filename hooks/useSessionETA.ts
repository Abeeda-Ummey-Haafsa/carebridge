import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { useCaregiverStore } from "@/store/caregiverStore";
import { useMemo } from "react";

type ETAData = {
  duration_seconds: number;
  duration_text: string;
  distance_meters: number;
  distance_text: string;
  polyline_points: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  from_cache: boolean;
  cache_age_seconds: number;
};

export function useSessionETA(sessionId: number | null) {
  const queryClient = useQueryClient();
  const sessionStatus = useActiveSessionStore((s) => s.status);
  const setLocation = useCaregiverStore((s) => s.setLocation);

  const isArriving = sessionStatus === "arriving";

  const query = useQuery({
    queryKey: ["session", sessionId, "eta"],
    queryFn: async () => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/eta`);
      return res.data as ETAData;
    },
    enabled: !!sessionId && isArriving,
    refetchInterval: isArriving ? 60_000 : false,
    staleTime: 30_000,
  });

  const handlers = useMemo(
    () => ({
      caregiver_location_updated: (payload: Record<string, unknown>) => {
        const { lat, lng } = payload as { lat: number; lng: number };
        setLocation(lat, lng);
        queryClient.invalidateQueries({
          queryKey: ["session", sessionId, "eta"],
        });
      },
    }),
    [sessionId, queryClient, setLocation],
  );

  useRealtimeChannel(`session:${sessionId}`, handlers, !!sessionId);

  return {
    eta: query.data ?? null,
    duration: query.data?.duration_text ?? "Calculating...",
    distance: query.data?.distance_text ?? "--",
    polyline: query.data?.polyline_points ?? null,
    fromCache: query.data?.from_cache ?? false,
    isLoading: query.isLoading,
  };
}

export default useSessionETA;
