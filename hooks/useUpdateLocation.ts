import { useEffect, useRef } from "react";
import * as Location from "expo-location";
import { fetchAPI } from "@/lib/fetch";
import { useCaregiverStore } from "@/store/caregiverStore";
import { useActiveSessionStore } from "@/store/activeSessionStore";

export function useUpdateLocation() {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const setLocation = useCaregiverStore((s) => s.setLocation);
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const sessionStatus = useActiveSessionStore((s) => s.status);

  const isSessionActive =
    sessionStatus === "arriving" || sessionStatus === "checked_in";

  useEffect(() => {
    if (!isSessionActive || !sessionId) {
      watcherRef.current?.remove();
      watcherRef.current = null;
      return;
    }

    let lastSentAt = 0;

    async function startWatcher() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      watcherRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
          timeInterval: 10_000,
        },
        async (loc) => {
          const now = Date.now();
          if (now - lastSentAt < 10_000) return;
          lastSentAt = now;

          const { latitude: lat, longitude: lng } = loc.coords;
          setLocation(lat, lng);

          fetchAPI("/api/caregivers/me/location", {
            method: "PATCH",
            body: JSON.stringify({ lat, lng, session_id: sessionId }),
          }).catch(console.error);
        },
      );
    }

    startWatcher().catch(console.error);

    return () => {
      watcherRef.current?.remove();
      watcherRef.current = null;
    };
  }, [isSessionActive, sessionId]);
}

export default useUpdateLocation;
