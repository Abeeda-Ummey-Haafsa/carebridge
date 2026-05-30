import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import { useCaregiverStore } from "@/store/caregiverStore";

export function useToggleAvailability() {
  const queryClient = useQueryClient();
  const setAvailability = useCaregiverStore((state) => state.setAvailability);
  const currentProfile = useCaregiverStore((state) => state.profile);

  return useMutation({
    mutationFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/availability", {
        method: "PATCH",
      });
      return res.data as {
        caregiver_id: number;
        is_available: boolean;
        updated_at: string;
      };
    },
    onMutate: async () => {
      const previousValue = currentProfile?.is_available ?? false;
      setAvailability(!previousValue);
      await queryClient.cancelQueries({ queryKey: ["caregiver", "me"] });
      return { previousValue };
    },
    onSuccess: (data) => {
      setAvailability(data.is_available);
      queryClient.invalidateQueries({ queryKey: ["caregiver", "me"] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousValue !== undefined) {
        setAvailability(context.previousValue);
      }
      Alert.alert(
        "Could not update availability",
        "Please check your connection and try again.",
      );
    },
  });
}
