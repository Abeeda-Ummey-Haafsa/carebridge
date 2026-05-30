import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";

type ScheduleItem = {
  id: number;
  care_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  elder_name: string;
};

export function useTodaySchedule() {
  const today = new Date().toISOString().split("T")[0];

  const query = useQuery({
    queryKey: ["caregiver", "schedule", today],
    queryFn: async () => {
      const res = await fetchAPI(`/api/caregivers/me/schedule?date=${today}`);
      return res.data as ScheduleItem[];
    },
    staleTime: 60_000,
  });

  return {
    schedule: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
