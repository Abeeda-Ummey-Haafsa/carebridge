import { create } from "zustand";

import {
  RelativeDashboardSummary,
  RelativeSessionStatus,
} from "@/types/relative-dashboard";

interface RelativeDashboardStore {
  activeElderId: string;
  unreadNotifications: number;
  emergencyBadgeCount: number;
  liveSessionStatus: RelativeSessionStatus;
  dashboardSummary: RelativeDashboardSummary;
  setActiveElderId: (elderId: string) => void;
  setUnreadNotifications: (count: number) => void;
  setEmergencyBadgeCount: (count: number) => void;
  setLiveSessionStatus: (status: RelativeSessionStatus) => void;
  setDashboardSummary: (summary: RelativeDashboardSummary) => void;
}

export const useRelativeDashboardStore = create<RelativeDashboardStore>(
  (set) => ({
    activeElderId: "elder-elena",
    unreadNotifications: 4,
    emergencyBadgeCount: 1,
    liveSessionStatus: "Active session",
    dashboardSummary: {
      activeElders: 3,
      activeSessions: 1,
      upcomingBookings: 3,
      nearbyCaregivers: 18,
      unreadNotifications: 4,
      emergencyAlerts: 1,
      liveUpdates: 5,
    },
    setActiveElderId: (elderId: string) => set({ activeElderId: elderId }),
    setUnreadNotifications: (count: number) =>
      set({ unreadNotifications: count }),
    setEmergencyBadgeCount: (count: number) =>
      set({ emergencyBadgeCount: count }),
    setLiveSessionStatus: (status: RelativeSessionStatus) =>
      set({ liveSessionStatus: status }),
    setDashboardSummary: (summary: RelativeDashboardSummary) =>
      set({ dashboardSummary: summary }),
  }),
);
