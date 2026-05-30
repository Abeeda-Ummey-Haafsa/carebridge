import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useTaskStore } from "@/store/taskStore";
import type { SessionTask } from "@/types/db";

export function useSessionTasks(sessionId: number | null) {
  const setTasks = useTaskStore((s) => s.setTasks);
  const getCompleted = useTaskStore((s) => s.getCompletedCount);
  const getProgress = useTaskStore((s) => s.getProgressPct);
  const tasks = useTaskStore((s) =>
    sessionId ? s.tasksBySession[sessionId] : [],
  );

  const query = useQuery({
    queryKey: ["session", sessionId, "tasks"],
    queryFn: async () => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/tasks`);
      const fetchedTasks: SessionTask[] = res.data.tasks;
      setTasks(sessionId!, fetchedTasks);
      return res.data;
    },
    enabled: !!sessionId,
    staleTime: 60_000,
  });

  return {
    tasks: tasks ?? [],
    total: tasks?.length ?? 0,
    completedCount: sessionId ? getCompleted(sessionId) : 0,
    progressPct: sessionId ? getProgress(sessionId) : 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export default useSessionTasks;
