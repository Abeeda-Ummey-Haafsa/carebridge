import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

export function useEarnings(range: "week" | "month" | "year" = "month") {
  const query = useQuery({
    queryKey: ["caregiver", "earnings", range],
    queryFn: async () => {
      const res = await fetchAPI(`/api/caregivers/me/earnings?range=${range}`);
      return res.data;
    },
    staleTime: 30_000,
  });

  return {
    earnings: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useEarnings;
