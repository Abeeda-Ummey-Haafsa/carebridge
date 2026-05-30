import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchAPI } from "@/lib/fetch";

type AvailabilitySlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export function useAvailabilitySchedule() {
  const query = useQuery({
    queryKey: ["caregiver", "availability"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/availability");
      return (res.data ?? []) as AvailabilitySlot[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    schedule: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (schedule: AvailabilitySlot[]) => {
      const res = await fetchAPI("/api/caregivers/me/availability", {
        method: "PUT",
        body: JSON.stringify({ availability: schedule }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "availability"],
      });
      Alert.alert("Schedule Saved", "Your availability has been updated.");
    },
    onError: (error: Error) => {
      Alert.alert("Save Failed", error.message);
    },
  });

  function updateSchedule(schedule: AvailabilitySlot[]) {
    for (const slot of schedule) {
      if (
        typeof slot.day_of_week !== "number" ||
        slot.day_of_week < 0 ||
        slot.day_of_week > 6
      ) {
        Alert.alert("Save Failed", "day_of_week must be between 0 and 6");
        return;
      }

      if (
        !slot.start_time ||
        !slot.end_time ||
        slot.start_time >= slot.end_time
      ) {
        Alert.alert("Save Failed", "start_time must be less than end_time");
        return;
      }
    }

    mutation.mutate(schedule);
  }

  return {
    updateSchedule,
    isSaving: mutation.isPending,
  };
}
