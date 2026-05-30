import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useActiveSessionStore } from "@/store/activeSessionStore";
import { Alert } from "react-native";

type AllowedStatus = "arriving" | "paused" | "checked_in";

export function useUpdateSessionStatus(sessionId: number) {
  const queryClient = useQueryClient();
  const setStatus = useActiveSessionStore((s) => s.setStatus);
  const currentStatus = useActiveSessionStore((s) => s.status);

  return useMutation({
    mutationFn: async (targetStatus: AllowedStatus) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: targetStatus }),
      });
      return res.data as {
        session_id: number;
        status: string;
        updated_at: string;
      };
    },

    onMutate: async (targetStatus: AllowedStatus) => {
      const previousStatus = currentStatus;
      setStatus(targetStatus);
      await queryClient.cancelQueries({
        queryKey: ["session", sessionId, "detail"],
      });
      return { previousStatus };
    },

    onSuccess: (data) => {
      setStatus(data.status as AllowedStatus);
      queryClient.invalidateQueries({
        queryKey: ["session", sessionId, "detail"],
      });
    },

    onError: (_error, _targetStatus, context: any) => {
      if (context?.previousStatus) {
        setStatus(context.previousStatus as AllowedStatus);
      }
      Alert.alert(
        "Status Update Failed",
        "Could not update session status. Please try again.",
      );
    },
  });
}

export default useUpdateSessionStatus;
