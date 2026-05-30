import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";
import * as Location from "expo-location";
import { Alert } from "react-native";

export function useSendEmergencyAlert() {
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const elderId = useActiveSessionStore((s) => s.elder_id);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!elderId) throw new Error("No elder associated with this session");

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch {
        // proceed without location
      }

      const res = await fetchAPI("/api/emergency-alerts", {
        method: "POST",
        body: JSON.stringify({
          elder_id: elderId,
          alert_type: "sos",
          session_id: sessionId ?? undefined,
          lat,
          lng,
        }),
      });
      return res.data;
    },

    onSuccess: () => {
      Alert.alert(
        "Alert Sent",
        "Emergency alert sent. All linked relatives have been notified.",
        [{ text: "OK" }],
      );
    },

    onError: (error: any) => {
      Alert.alert(
        "Alert Failed",
        `Could not send alert: ${error?.message ?? String(error)}`,
      );
    },
  });

  function triggerSOS() {
    Alert.alert(
      "🚨 Send Emergency Alert?",
      "This will notify all linked relatives immediately.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send Alert", onPress: () => mutation.mutate() },
      ],
    );
  }

  return {
    triggerSOS,
    isSending: mutation.isPending,
  };
}

export default useSendEmergencyAlert;
