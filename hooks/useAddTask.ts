import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { useTaskStore } from "@/store/taskStore";
import type { SessionTask } from "@/types/db";

export function useAddTask(sessionId: number) {
  const queryClient = useQueryClient();
  const addTask = useTaskStore((s) => s.addTask);

  return useMutation({
    mutationFn: async (task_name: string) => {
      const res = await fetchAPI(`/api/care-sessions/${sessionId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ task_name: task_name.trim() }),
      });
      return res.data.task as SessionTask;
    },

    onMutate: async (task_name: string) => {
      const tempTask: SessionTask = {
        id: -Date.now(),
        session_id: sessionId,
        task_name: task_name.trim(),
        is_completed: false,
        notes: null,
        is_custom: true,
        sort_order: 999,
        completed_at: null,
        created_at: new Date().toISOString(),
      };
      addTask(sessionId, tempTask);
      return { tempId: tempTask.id };
    },

    onSuccess: (confirmedTask, _taskName, context: any) => {
      const tasks = useTaskStore.getState().tasksBySession[sessionId] ?? [];
      const updated = tasks
        .filter((t) => t.id !== context?.tempId)
        .concat(confirmedTask);
      useTaskStore.getState().setTasks(sessionId, updated);
    },

    onError: (_error, _taskName, context: any) => {
      const tasks = useTaskStore.getState().tasksBySession[sessionId] ?? [];
      const rolled = tasks.filter((t) => t.id !== context?.tempId);
      useTaskStore.getState().setTasks(sessionId, rolled);
    },
  });
}

export default useAddTask;
