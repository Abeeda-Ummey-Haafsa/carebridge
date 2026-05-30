import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useTaskStore } from "@/store/taskStore";

export function useToggleTask(sessionId: number) {
  const toggleTask = useTaskStore((s) => s.toggleTask);

  return useMutation({
    mutationFn: async ({
      taskId,
      is_completed,
      notes,
    }: {
      taskId: number;
      is_completed: boolean;
      notes?: string | null;
    }) => {
      const res = await fetchAPI(`/api/session-tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ is_completed, notes }),
      });
      return res.data.task;
    },

    onMutate: async ({ taskId, is_completed }) => {
      const completed_at = is_completed ? new Date().toISOString() : null;
      toggleTask(sessionId, taskId, is_completed, completed_at);
    },

    onSuccess: (updatedTask: any) => {
      toggleTask(
        sessionId,
        updatedTask.id,
        updatedTask.is_completed,
        updatedTask.completed_at,
      );
    },

    onError: (_error, { taskId, is_completed }) => {
      toggleTask(sessionId, taskId, !is_completed, null);
    },
  });
}

export default useToggleTask;
