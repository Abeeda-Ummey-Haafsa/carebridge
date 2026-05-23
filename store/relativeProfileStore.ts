import { create } from "zustand";

export type CareStatus = "Active" | "Stable" | "Needs Attention";
export type MobilityLevel = "Independent" | "Assisted" | "Wheelchair";
export type ThemeMode = "system" | "light" | "dark";

export interface RelativeProfile {
  fullName: string;
  email: string;
  memberSince: string;
  verified: boolean;
  profileCompletion: number;
}

export interface ElderProfile {
  id: string;
  name: string;
  mobilityLevel: MobilityLevel;
  careStatus: CareStatus;
  preferredLanguage: string;
  activeCaregiver: string;
  emergencyFlag: boolean;
  expanded: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expiry: string;
  isDefault: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  priority: "Primary" | "Secondary";
}

export interface RelativeNotificationSettings {
  sessionUpdates: boolean;
  caregiverMessages: boolean;
  emergencyAlerts: boolean;
  bookingReminders: boolean;
  paymentNotifications: boolean;
  caregiverArrivalAlerts: boolean;
}

export interface RelativePreferenceSettings {
  darkMode: boolean;
  accessibilityMode: boolean;
  reduceMotion: boolean;
  language: string;
  fontScale: "Default" | "Large";
  themeMode: ThemeMode;
}

export interface RelativeSecuritySettings {
  biometricLogin: boolean;
  sosNotifications: boolean;
  locationSharing: boolean;
}

interface RelativeProfileStore {
  isLoading: boolean;
  profile: RelativeProfile;
  elders: ElderProfile[];
  selectedElderId: string;
  paymentMethods: PaymentMethod[];
  emergencyContacts: EmergencyContact[];
  notifications: RelativeNotificationSettings;
  preferences: RelativePreferenceSettings;
  security: RelativeSecuritySettings;
  stats: {
    activeSessions: number;
    completedBookings: number;
    monthlySpend: number;
    averageCaregiverRating: number;
  };
  monthlySpendTrend: Array<{ label: string; value: number }>;
  bookingTrend: Array<{ label: string; value: number }>;

  setLoading: (loading: boolean) => void;
  selectElder: (elderId: string) => void;
  toggleElderExpanded: (elderId: string) => void;
  addMockElder: () => void;
  toggleNotification: (key: keyof RelativeNotificationSettings) => void;
  togglePreference: (
    key: keyof Pick<
      RelativePreferenceSettings,
      "darkMode" | "accessibilityMode" | "reduceMotion"
    >,
  ) => void;
  toggleSecurity: (key: keyof RelativeSecuritySettings) => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const mockElders: ElderProfile[] = [
  {
    id: "elder-1",
    name: "Margaret Chen",
    mobilityLevel: "Assisted",
    careStatus: "Active",
    preferredLanguage: "English",
    activeCaregiver: "Rachel Thompson",
    emergencyFlag: false,
    expanded: true,
  },
  {
    id: "elder-2",
    name: "Arthur Collins",
    mobilityLevel: "Independent",
    careStatus: "Stable",
    preferredLanguage: "English",
    activeCaregiver: "David Park",
    emergencyFlag: false,
    expanded: false,
  },
  {
    id: "elder-3",
    name: "Nafisa Rahman",
    mobilityLevel: "Wheelchair",
    careStatus: "Needs Attention",
    preferredLanguage: "Bangla",
    activeCaregiver: "Unassigned",
    emergencyFlag: true,
    expanded: false,
  },
];

export const useRelativeProfileStore = create<RelativeProfileStore>((set) => ({
  isLoading: false,
  profile: {
    fullName: "Sarah Johnson",
    email: "sarah.johnson@carebridge.app",
    memberSince: "May 2024",
    verified: true,
    profileCompletion: 82,
  },
  elders: mockElders,
  selectedElderId: mockElders[0].id,
  paymentMethods: [
    {
      id: "pm-1",
      brand: "Visa",
      last4: "4821",
      expiry: "09/29",
      isDefault: true,
    },
    {
      id: "pm-2",
      brand: "Mastercard",
      last4: "7390",
      expiry: "01/30",
      isDefault: false,
    },
  ],
  emergencyContacts: [
    {
      id: "ec-1",
      name: "Daniel Johnson",
      relationship: "Son",
      phone: "+880-1700-123-456",
      priority: "Primary",
    },
    {
      id: "ec-2",
      name: "Asha Karim",
      relationship: "Neighbor",
      phone: "+880-1711-998-712",
      priority: "Secondary",
    },
  ],
  notifications: {
    sessionUpdates: true,
    caregiverMessages: true,
    emergencyAlerts: true,
    bookingReminders: true,
    paymentNotifications: true,
    caregiverArrivalAlerts: false,
  },
  preferences: {
    darkMode: false,
    accessibilityMode: false,
    reduceMotion: false,
    language: "English",
    fontScale: "Default",
    themeMode: "system",
  },
  security: {
    biometricLogin: true,
    sosNotifications: true,
    locationSharing: true,
  },
  stats: {
    activeSessions: 2,
    completedBookings: 42,
    monthlySpend: 1820,
    averageCaregiverRating: 4.8,
  },
  monthlySpendTrend: [
    { label: "Jan", value: 1240 },
    { label: "Feb", value: 1460 },
    { label: "Mar", value: 1320 },
    { label: "Apr", value: 1750 },
    { label: "May", value: 1820 },
  ],
  bookingTrend: [
    { label: "W1", value: 5 },
    { label: "W2", value: 7 },
    { label: "W3", value: 4 },
    { label: "W4", value: 8 },
  ],

  setLoading: (loading) => set({ isLoading: loading }),
  selectElder: (elderId) => set({ selectedElderId: elderId }),
  toggleElderExpanded: (elderId) =>
    set((state) => ({
      elders: state.elders.map((elder) =>
        elder.id === elderId ? { ...elder, expanded: !elder.expanded } : elder,
      ),
    })),
  addMockElder: () =>
    set((state) => ({
      elders: [
        ...state.elders,
        {
          id: `elder-${state.elders.length + 1}`,
          name: `New Elder ${state.elders.length + 1}`,
          mobilityLevel: "Assisted",
          careStatus: "Stable",
          preferredLanguage: "English",
          activeCaregiver: "Unassigned",
          emergencyFlag: false,
          expanded: false,
        },
      ],
    })),
  toggleNotification: (key) =>
    set((state) => ({
      notifications: {
        ...state.notifications,
        [key]: !state.notifications[key],
      },
    })),
  togglePreference: (key) =>
    set((state) => ({
      preferences: { ...state.preferences, [key]: !state.preferences[key] },
    })),
  toggleSecurity: (key) =>
    set((state) => ({
      security: { ...state.security, [key]: !state.security[key] },
    })),
  setThemeMode: (mode) =>
    set((state) => ({
      preferences: { ...state.preferences, themeMode: mode },
    })),
}));

export const selectProfileQuickStats = (
  eldersCount: number,
  activeSessions: number,
  completedBookings: number,
  emergencyCount: number,
) => {
  return [
    { label: "Elders", value: eldersCount.toString() },
    { label: "Active", value: activeSessions.toString() },
    { label: "Completed", value: completedBookings.toString() },
    { label: "Emergency", value: emergencyCount.toString() },
  ];
};
