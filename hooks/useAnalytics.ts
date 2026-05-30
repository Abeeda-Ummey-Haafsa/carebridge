import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

export function useAnalytics(range: "30d" | "90d" | "365d" = "30d") {
  const query = useQuery({
    queryKey: ["caregiver", "analytics", range],
    queryFn: async () => {
      const res = await fetchAPI(`/api/caregivers/me/analytics?range=${range}`);
      return res.data;
    },
    staleTime: 60_000,
  });

  return {
    analytics: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useAnalytics;
