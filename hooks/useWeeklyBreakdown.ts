import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

export function useWeeklyBreakdown(weeks = 12) {
  const query = useQuery({
    queryKey: ["caregiver", "earnings", "weekly", weeks],
    queryFn: async () => {
      const params = new URLSearchParams({ weeks: String(weeks) });
      const res = await fetchAPI(
        `/api/caregivers/me/earnings/weekly?${params}`,
      );
      return res.data;
    },
    staleTime: 60_000,
  });

  return {
    weekly: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useWeeklyBreakdown;
