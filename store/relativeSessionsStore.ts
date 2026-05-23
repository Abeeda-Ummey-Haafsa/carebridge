import { create } from "zustand";

export type SessionStatus = "Active" | "Upcoming" | "Completed" | "Cancelled";
export type SessionFilter = "All" | SessionStatus;
export type SessionSortOption =
  | "newest"
  | "oldest"
  | "highest-payment"
  | "upcoming-first"
  | "active-first";
export type AnalyticsFilter = "weekly" | "monthly";

export interface RelativeCareSession {
  id: string;
  elderName: string;
  caregiverName: string;
  careType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  cost: number;
  status: SessionStatus;
  notes: string;
  location: string;
  caregiverAvatarUrl: string;
  elderAvatarUrl: string;
  caregiverRating?: number;
  checkInTime?: string;
  checkOutTime?: string;
  eta?: string;
  progress?: number;
  caregiverStatus?: "en route" | "checked in" | "active care" | "ending soon";
  updatesCount?: number;
  sessionUpdates?: SessionUpdate[];
}

export interface SessionUpdate {
  id: string;
  timestamp: string;
  message: string;
  type: "check-in" | "care-update" | "alert" | "completion";
}

export interface SpendingPoint {
  label: string;
  value: number;
}

export interface SessionCountSummary {
  all: number;
  active: number;
  upcoming: number;
  completed: number;
  cancelled: number;
}

export interface RelativeSessionsState {
  sessions: RelativeCareSession[];
  activeFilter: SessionFilter;
  searchQuery: string;
  sortBy: SessionSortOption;
  expandedSessionIds: string[];
  selectedSession: RelativeCareSession | null;
  page: number;
  pageSize: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  analyticsFilter: AnalyticsFilter;
  totalSpentThisMonth: number;
  activeSessions: number;
  upcomingSessions: number;
  spendingTrend: SpendingPoint[];

  setFilter: (filter: SessionFilter) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SessionSortOption) => void;
  setAnalyticsFilter: (filter: AnalyticsFilter) => void;
  toggleSessionExpanded: (id: string) => void;
  clearExpandedSessions: () => void;
  setSelectedSession: (session: RelativeCareSession | null) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

const mockSessions: RelativeCareSession[] = [
  {
    id: "1",
    elderName: "Margaret Chen",
    caregiverName: "Rachel Thompson",
    careType: "Medical Care",
    date: "2026-05-23",
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    duration: "3 hrs",
    cost: 75,
    status: "Active",
    notes: "Morning medication and vitals check",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    caregiverRating: 4.8,
    checkInTime: "09:05 AM",
    eta: "3 mins",
    progress: 62,
    caregiverStatus: "active care",
    updatesCount: 2,
    sessionUpdates: [
      {
        id: "u1",
        timestamp: "09:05 AM",
        message: "Rachel checked in",
        type: "check-in",
      },
      {
        id: "u2",
        timestamp: "09:30 AM",
        message: "Vitals normal. Margaret in good health",
        type: "care-update",
      },
    ],
  },
  {
    id: "2",
    elderName: "Margaret Chen",
    caregiverName: "David Williams",
    careType: "Companionship",
    date: "2026-05-24",
    startTime: "02:00 PM",
    endTime: "05:00 PM",
    duration: "3 hrs",
    cost: 60,
    status: "Upcoming",
    notes: "Afternoon walk and conversation",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    caregiverRating: 4.9,
    eta: "On schedule",
    progress: 0,
    caregiverStatus: "en route",
    updatesCount: 1,
  },
  {
    id: "3",
    elderName: "Margaret Chen",
    caregiverName: "Sarah Martinez",
    careType: "Mobility Support",
    date: "2026-05-22",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    duration: "2 hrs",
    cost: 50,
    status: "Completed",
    notes: "Physical therapy and rehabilitation exercises",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    caregiverRating: 4.7,
    checkInTime: "10:02 AM",
    checkOutTime: "12:05 PM",
    progress: 100,
    caregiverStatus: "checked in",
    updatesCount: 3,
  },
  {
    id: "4",
    elderName: "Margaret Chen",
    caregiverName: "Emma Johnson",
    careType: "Medical Care",
    date: "2026-05-20",
    startTime: "08:00 AM",
    endTime: "11:00 AM",
    duration: "3 hrs",
    cost: 75,
    status: "Completed",
    notes: "Post-procedure monitoring",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    caregiverRating: 4.9,
    checkInTime: "08:01 AM",
    checkOutTime: "11:02 PM",
    progress: 100,
    caregiverStatus: "checked in",
    updatesCount: 4,
  },
  {
    id: "5",
    elderName: "Margaret Chen",
    caregiverName: "Lisa Anderson",
    careType: "Companionship",
    date: "2026-05-19",
    startTime: "03:00 PM",
    endTime: "05:00 PM",
    duration: "2 hrs",
    cost: 40,
    status: "Cancelled",
    notes: "Family requested cancellation",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    updatesCount: 0,
  },
  {
    id: "6",
    elderName: "Margaret Chen",
    caregiverName: "Rachel Thompson",
    careType: "Medical Care",
    date: "2026-05-25",
    startTime: "09:00 AM",
    endTime: "12:00 PM",
    duration: "3 hrs",
    cost: 75,
    status: "Upcoming",
    notes: "Weekly medication administration",
    location: "123 Maple St, Springfield",
    caregiverAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    elderAvatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
    caregiverRating: 4.8,
    caregiverStatus: "en route",
    updatesCount: 1,
  },
];

const mockSpendingTrend: SpendingPoint[] = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 185 },
  { label: "Wed", value: 155 },
  { label: "Thu", value: 205 },
  { label: "Fri", value: 170 },
  { label: "Sat", value: 92 },
  { label: "Sun", value: 76 },
];

const DEFAULT_PAGE_SIZE = 12;

export const useRelativeSessionsStore = create<RelativeSessionsState>(
  (set) => ({
    sessions: mockSessions,
    activeFilter: "All",
    searchQuery: "",
    sortBy: "newest",
    expandedSessionIds: [],
    selectedSession: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    hasMore: true,
    isLoading: false,
    isRefreshing: false,
    analyticsFilter: "weekly",
    totalSpentThisMonth: 475,
    activeSessions: 1,
    upcomingSessions: 2,
    spendingTrend: mockSpendingTrend,

    setFilter: (filter) => set({ activeFilter: filter, page: 1 }),
    setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),
    setSortBy: (sort) => set({ sortBy: sort, page: 1 }),
    setAnalyticsFilter: (filter) => set({ analyticsFilter: filter }),
    toggleSessionExpanded: (id) =>
      set((state) => ({
        expandedSessionIds: state.expandedSessionIds.includes(id)
          ? state.expandedSessionIds.filter((sessionId) => sessionId !== id)
          : [...state.expandedSessionIds, id],
      })),
    clearExpandedSessions: () => set({ expandedSessionIds: [] }),
    setSelectedSession: (session) => set({ selectedSession: session }),
    setPage: (page) => set({ page }),
    setPageSize: (size) => set({ pageSize: size }),
    setHasMore: (hasMore) => set({ hasMore }),
    setLoading: (loading) => set({ isLoading: loading }),
    setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
  }),
);

export const selectSessionCountSummary = (
  sessions: RelativeCareSession[],
): SessionCountSummary => ({
  all: sessions.length,
  active: sessions.filter((session) => session.status === "Active").length,
  upcoming: sessions.filter((session) => session.status === "Upcoming").length,
  completed: sessions.filter((session) => session.status === "Completed")
    .length,
  cancelled: sessions.filter((session) => session.status === "Cancelled")
    .length,
});

export const selectCompletedSpending = (sessions: RelativeCareSession[]) =>
  sessions
    .filter((session) => session.status === "Completed")
    .reduce((total, session) => total + session.cost, 0);
