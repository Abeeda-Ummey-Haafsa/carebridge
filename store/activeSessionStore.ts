import { create } from "zustand";

type SessionStatus =
  | "pending"
  | "accepted"
  | "arriving"
  | "checked_in"
  | "paused"
  | "completed"
  | "cancelled";

interface ActiveSessionStore {
  sessionId: number | null;
  status: SessionStatus | null;
  care_type: string | null;
  elder_name: string | null;
  elder_id: number | null;
  checked_in_at: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  elder_lat: number | null;
  elder_lng: number | null;
  setSession: (session: Partial<ActiveSessionStore>) => void;
  setStatus: (status: SessionStatus) => void;
  clearSession: () => void;
}

export const useActiveSessionStore = create<ActiveSessionStore>((set, get) => ({
  sessionId: null,
  status: null,
  care_type: null,
  elder_name: null,
  elder_id: null,
  checked_in_at: null,
  scheduled_at: null,
  duration_minutes: null,
  elder_lat: null,
  elder_lng: null,
  setSession: (session) => set((state) => ({ ...state, ...session })),
  setStatus: (status) => set(() => ({ status })),
  clearSession: () =>
    set(() => ({
      sessionId: null,
      status: null,
      care_type: null,
      elder_name: null,
      elder_id: null,
      checked_in_at: null,
      scheduled_at: null,
      duration_minutes: null,
      elder_lat: null,
      elder_lng: null,
    })),
}));

export default useActiveSessionStore;
