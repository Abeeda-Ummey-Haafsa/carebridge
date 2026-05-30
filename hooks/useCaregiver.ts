import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import {
  useCaregiverStore,
  type CaregiverProfile,
} from "@/store/caregiverStore";

export function useCaregiver() {
  const setProfile = useCaregiverStore((state) => state.setProfile);

  const query = useQuery({
    queryKey: ["caregiver", "me"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me");
      const existingPushToken =
        useCaregiverStore.getState().profile?.push_token ?? null;
      const profile: CaregiverProfile = {
        ...res.data,
        push_token: existingPushToken,
      };
      setProfile(profile);
      return profile;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  return {
    caregiver: query.data ?? useCaregiverStore.getState().profile,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
