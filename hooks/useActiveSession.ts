import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";

type SessionStatus =
  | "pending"
  | "accepted"
  | "arriving"
  | "checked_in"
  | "paused"
  | "completed"
  | "cancelled";

type ActiveSessionData = {
  sessionId: number;
  status: SessionStatus;
  care_type: string;
  elder_name: string;
  elder_id: number;
  checked_in_at: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  elder_lat: number | null;
  elder_lng: number | null;
  elapsed_seconds?: number;
  estimated_end_time?: string | null;
};

export function useActiveSession() {
  const setSession = useActiveSessionStore((state) => state.setSession);

  const query = useQuery({
    queryKey: ["caregiver", "active-session"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/active-session");
      if (!res || !res.data) {
        useActiveSessionStore.getState().clearSession();
        return null;
      }

      setSession(res.data as ActiveSessionData);
      return res.data as ActiveSessionData;
    },
    refetchInterval: (query) => {
      const data = query.state.data as ActiveSessionData | null | undefined;
      if (!data) return false;
      const activeStatuses = ["arriving", "checked_in", "accepted"];
      return activeStatuses.includes(data.status) ? 15_000 : false;
    },
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });

  return {
    activeSession: query.data,
    hasActiveSession: !!query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
