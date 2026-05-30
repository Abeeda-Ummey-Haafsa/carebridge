import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

export function useMonthlyBreakdown(months = 12) {
  const query = useQuery({
    queryKey: ["caregiver", "earnings", "monthly", months],
    queryFn: async () => {
      const params = new URLSearchParams({ months: String(months) });
      const res = await fetchAPI(
        `/api/caregivers/me/earnings/monthly?${params}`,
      );
      return res.data;
    },
    staleTime: 60_000,
  });

  return {
    monthly: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useMonthlyBreakdown;
