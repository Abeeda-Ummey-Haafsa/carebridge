import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { fetchAPI } from "@/lib/fetch";

type NotificationPreferences = {
  booking_alerts: boolean;
  message_alerts: boolean;
  sos_alerts: boolean;
  reminder_notifications: boolean;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  booking_alerts: true,
  message_alerts: true,
  sos_alerts: true,
  reminder_notifications: true,
};

export function useNotificationPreferences() {
  const query = useQuery({
    queryKey: ["caregiver", "notification-preferences"],
    queryFn: async () => {
      const res = await fetchAPI("/api/caregivers/me/notification-preferences");
      return {
        ...DEFAULT_PREFERENCES,
        ...(res.data ?? {}),
      } as NotificationPreferences;
    },
    staleTime: 10 * 60 * 1000,
  });

  return {
    preferences: query.data ?? DEFAULT_PREFERENCES,
    isLoading: query.isLoading,
  };
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const res = await fetchAPI(
        "/api/caregivers/me/notification-preferences",
        {
          method: "PATCH",
          body: JSON.stringify(prefs),
        },
      );
      return res.data as Partial<NotificationPreferences>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["caregiver", "notification-preferences"],
      });
    },
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(
    (prefs: Partial<NotificationPreferences>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        mutation.mutate(prefs);
      }, 500);
    },
    [mutation],
  );

  return {
    debouncedUpdate,
  };
}
