import { create } from "zustand";
import type { SessionTask } from "@/types/db";

interface TaskStore {
  tasksBySession: Record<number, SessionTask[]>;
  setTasks: (sessionId: number, tasks: SessionTask[]) => void;
  toggleTask: (
    sessionId: number,
    taskId: number,
    is_completed: boolean,
    completed_at: string | null,
  ) => void;
  addTask: (sessionId: number, task: SessionTask) => void;
  updateTaskNotes: (
    sessionId: number,
    taskId: number,
    notes: string | null,
  ) => void;
  clearSession: (sessionId: number) => void;
  getCompletedCount: (sessionId: number) => number;
  getProgressPct: (sessionId: number) => number;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasksBySession: {},
  setTasks: (sessionId, tasks) =>
    set((state) => ({
      tasksBySession: { ...state.tasksBySession, [sessionId]: tasks },
    })),
  toggleTask: (sessionId, taskId, is_completed, completed_at) =>
    set((state) => ({
      tasksBySession: {
        ...state.tasksBySession,
        [sessionId]: (state.tasksBySession[sessionId] || []).map((t) =>
          t.id === taskId ? { ...t, is_completed, completed_at } : t,
        ),
      },
    })),
  addTask: (sessionId, task) =>
    set((state) => ({
      tasksBySession: {
        ...state.tasksBySession,
        [sessionId]: [...(state.tasksBySession[sessionId] || []), task],
      },
    })),
  updateTaskNotes: (sessionId, taskId, notes) =>
    set((state) => ({
      tasksBySession: {
        ...state.tasksBySession,
        [sessionId]: (state.tasksBySession[sessionId] || []).map((t) =>
          t.id === taskId ? { ...t, notes } : t,
        ),
      },
    })),
  clearSession: (sessionId) =>
    set((state) => {
      const copy = { ...state.tasksBySession };
      delete copy[sessionId];
      return { tasksBySession: copy };
    }),
  getCompletedCount: (sessionId) => {
    const tasks = get().tasksBySession[sessionId] || [];
    return tasks.filter((t) => t.is_completed).length;
  },
  getProgressPct: (sessionId) => {
    const tasks = get().tasksBySession[sessionId] || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.is_completed).length;
    return Math.round((completed / tasks.length) * 1000) / 10;
  },
}));

export default useTaskStore;
