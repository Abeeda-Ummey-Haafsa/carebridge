import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";
import { router } from "expo-router";
import { Alert } from "react-native";

export function useCheckOut(sessionId: number) {
  const queryClient = useQueryClient();
  const clearSession = useActiveSessionStore((s) => s.clearSession);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/check-out`, {
        method: "POST",
      });
      return res.data as {
        session_id: number;
        status: string;
        checked_out_at: string;
        actual_duration_minutes: number;
        total_cost: number;
        payment_id: number;
      };
    },

    onSuccess: (data) => {
      clearSession();
      queryClient.invalidateQueries({ queryKey: ["caregiver", "sessions"] });
      queryClient.invalidateQueries({ queryKey: ["caregiver", "schedule"] });
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "active-session"],
      });
      queryClient.invalidateQueries({ queryKey: ["caregiver", "requests"] });

      const cost = data.total_cost.toFixed(2);
      Alert.alert("Session Complete", `Great work! Session total: $${cost}`, [
        {
          text: "Done",
          onPress: () => router.replace("/(root)/(tabs)/caregiver/home"),
        },
      ]);
    },

    onError: (error: any) => {
      Alert.alert("Check-Out Failed", error?.message ?? String(error));
    },
  });

  function confirmCheckOut() {
    Alert.alert("Check Out", "Are you sure you want to end this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Check Out",
        style: "destructive",
        onPress: () => mutation.mutate(),
      },
    ]);
  }

  return {
    confirmCheckOut,
    isCheckingOut: mutation.isPending,
  };
}

export default useCheckOut;
