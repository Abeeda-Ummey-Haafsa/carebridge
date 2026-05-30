import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";
import { useTaskStore } from "@/store/taskStore";
import * as Location from "expo-location";
import { Alert } from "react-native";

export function useCheckIn(sessionId: number) {
  const queryClient = useQueryClient();
  const setStatus = useActiveSessionStore((s) => s.setStatus);

  return useMutation({
    mutationFn: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error(
          "Location permission denied. Enable location to check in.",
        );
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const res = await fetchAPI(`/api/care-sessions/${sessionId}/check-in`, {
        method: "POST",
        body: JSON.stringify({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }),
      });
      return res.data as {
        session_id: number;
        status: string;
        checked_in_at: string;
        tasks_seeded: number;
      };
    },

    onSuccess: (data) => {
      setStatus("checked_in");
      useActiveSessionStore.setState({ checked_in_at: data.checked_in_at });

      queryClient.invalidateQueries({
        queryKey: ["session", sessionId, "detail"],
      });
      queryClient.invalidateQueries({
        queryKey: ["session", sessionId, "tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "active-session"],
      });

      Alert.alert(
        "Checked In",
        `Session started — ${data.tasks_seeded} tasks ready.`,
      );
    },

    onError: (error: any) => {
      if (
        error?.message?.includes("500m") ||
        error?.message?.includes("distance")
      ) {
        Alert.alert("Too far from elder", error.message);
      } else {
        Alert.alert("Check-In Failed", error.message ?? String(error));
      }
    },
  });
}

export default useCheckIn;
