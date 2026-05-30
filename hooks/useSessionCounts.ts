import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

export function useSessionCounts() {
  const query = useQuery({
    queryKey: ["caregiver", "session-counts"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/session-counts");
      return res.data;
    },
    staleTime: 60_000,
  });

  return {
    counts: query.data ?? {
      upcoming: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    },
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useSessionCounts;
