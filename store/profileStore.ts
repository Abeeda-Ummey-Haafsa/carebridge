import { create } from "zustand";

export interface CaregiverProfile {
  bio: string;
  hourlyRate: string;
  experienceYears: number;
  languages: string[];
  careTypes: string[];
  serviceRadius: string;
  totalSessions: number;
  averageRating: number;
  responseRate: string;
}

export interface SettingsState {
  notifications: {
    bookingAlerts: boolean;
    messageAlerts: boolean;
    sosAlerts: boolean;
    reminders: boolean;
  };
  preferences: {
    autoAccept: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
}

interface ProfileStore {
  profile: CaregiverProfile;
  settings: SettingsState;
  isAvailable: boolean;
  toggleAvailability: () => void;
  updateProfile: (profile: Partial<CaregiverProfile>) => void;
  toggleSetting: (group: "notifications" | "preferences", key: string) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: {
    bio: "Passionate about providing high-quality care to elders. Specialized in mobility support and post-surgery recovery. Dedicated to improving clients' quality of life safely.",
    hourlyRate: "৳25/hr",
    experienceYears: 4,
    languages: ["English", "Bangla"],
    careTypes: ["Medical Care", "Companionship", "Mobility"],
    serviceRadius: "10 miles",
    totalSessions: 142,
    averageRating: 4.9,
    responseRate: "98%",
  },
  settings: {
    notifications: {
      bookingAlerts: true,
      messageAlerts: true,
      sosAlerts: true,
      reminders: true,
    },
    preferences: {
      autoAccept: false,
      highContrast: false,
      largeText: false,
    },
  },
  isAvailable: true,
  toggleAvailability: () =>
    set((state) => ({ isAvailable: !state.isAvailable })),
  updateProfile: (updates) =>
    set((state) => ({ profile: { ...state.profile, ...updates } })),
  toggleSetting: (group, key) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [group]: {
          ...state.settings[group],
          [key]:
            !state.settings[group][
              key as keyof (typeof state.settings)[typeof group]
            ],
        },
      },
    })),
}));
