import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { fetchAPI } from "@/lib/fetch";
import {
  useCaregiverStore,
  type CaregiverProfile,
} from "@/store/caregiverStore";

type ProfileUpdatePayload = Partial<{
  bio: string;
  hourly_rate: number;
  years_experience: number;
  care_types: string[];
  languages: string[];
  service_radius_km: number;
}>;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useCaregiverStore((state) => state.setProfile);

  return useMutation({
    mutationFn: async (payload: ProfileUpdatePayload) => {
      if (payload.hourly_rate !== undefined && payload.hourly_rate <= 0) {
        throw new Error("Hourly rate must be greater than 0");
      }

      const res = await fetchAPI("/api/caregivers/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      return res.data as Partial<CaregiverProfile>;
    },
    onSuccess: (updatedProfile) => {
      const currentProfile = useCaregiverStore.getState().profile;
      if (currentProfile) {
        setProfile({
          ...currentProfile,
          ...updatedProfile,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["caregiver", "me"] });
      Alert.alert("Profile Updated", "Your profile has been saved.");
    },
    onError: (error: Error) => {
      Alert.alert("Update Failed", error.message);
    },
  });
}
