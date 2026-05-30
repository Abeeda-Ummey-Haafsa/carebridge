import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { useMemo } from "react";

export function useSessionNotes(sessionId: number | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["session", sessionId, "notes"],
    queryFn: async () => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/notes`);
      return res.data.notes as any[];
    },
    enabled: !!sessionId,
    staleTime: 30_000,
  });

  const handlers = useMemo(
    () => ({
      note_added: (payload: Record<string, unknown>) => {
        queryClient.setQueryData(
          ["session", sessionId, "notes"],
          (old: any[] | undefined) => [
            payload as unknown as any,
            ...(old ?? []),
          ],
        );
      },
    }),
    [sessionId, queryClient],
  );

  useRealtimeChannel(`session:${sessionId}`, handlers, !!sessionId);

  return {
    notes: query.data ?? [],
    total: query.data?.length ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useSessionNotes;
