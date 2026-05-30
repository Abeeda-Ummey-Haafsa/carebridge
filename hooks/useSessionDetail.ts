import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";

export function useSessionDetail(sessionId: number | null) {
  const setSession = useActiveSessionStore((s) => s.setSession);

  const query = useQuery({
    queryKey: ["session", sessionId, "detail"],
    queryFn: async () => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}`);
      const data = res.data;
      setSession({
        sessionId: data.session.id,
        status: data.session.status,
        care_type: data.session.care_type,
        elder_name: data.elder.name,
        elder_id: data.elder.id,
        checked_in_at: data.session.checked_in_at,
        scheduled_at: data.session.scheduled_at,
        duration_minutes: data.session.duration_minutes,
        elder_lat: data.session.elder_lat,
        elder_lng: data.session.elder_lng,
      });
      return data;
    },
    enabled: !!sessionId,
    staleTime: 30_000,
  });

  return {
    session: query.data?.session ?? null,
    elder: query.data?.elder ?? null,
    emergencyContacts: query.data?.emergency_contacts ?? [],
    caregiverLocation: query.data?.caregiver_location ?? {
      lat: null,
      lng: null,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export default useSessionDetail;
