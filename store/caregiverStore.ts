import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CaregiverProfile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  bio: string | null;
  hourly_rate: number | null;
  years_experience: number;
  care_types: string[];
  languages: string[];
  avg_rating: number;
  total_reviews: number;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  service_radius_km: number;
  push_token: string | null;
}

interface CaregiverStore {
  profile: CaregiverProfile | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  setProfile: (profile: CaregiverProfile) => void;
  setAvailability: (is_available: boolean) => void;
  setPushToken: (token: string | null) => void;
  setLocation: (lat: number, lng: number) => void;
  clearProfile: () => void;
}

export const useCaregiverStore = create<CaregiverStore>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      lastFetchedAt: null,
      setProfile: (profile) => set({ profile, lastFetchedAt: Date.now() }),
      setAvailability: (is_available) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, is_available }
            : state.profile,
        })),
      setPushToken: (token) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, push_token: token }
            : state.profile,
        })),
      setLocation: (lat, lng) =>
        set((state) => ({
          profile: state.profile
            ? { ...state.profile, current_lat: lat, current_lng: lng }
            : state.profile,
        })),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: "carebridge-caregiver-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile }),
    },
  ),
);

export default useCaregiverStore;
