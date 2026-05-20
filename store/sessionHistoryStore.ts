import { create } from "zustand";

export type SessionStatus = "Upcoming" | "Completed" | "Cancelled";

export interface CareSession {
  id: string;
  elderName: string;
  careType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  payout: number;
  status: SessionStatus;
  notes: string;
  location: string;
  avatarUrl: string;
}

export interface SessionHistoryState {
  sessions: CareSession[];
  activeFilter: "All" | SessionStatus;
  searchQuery: string;
  sortBy: "newest" | "oldest" | "highest earnings" | "longest";
  selectedSession: CareSession | null;
  isLoading: boolean;

  setFilter: (filter: "All" | SessionStatus) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (
    sort: "newest" | "oldest" | "highest earnings" | "longest",
  ) => void;
  setSelectedSession: (session: CareSession | null) => void;
  setLoading: (loading: boolean) => void;
}

const mockSessions: CareSession[] = [
  {
    id: "1",
    elderName: "Elena Rodriguez",
    careType: "Medical Care",
    date: "2026-05-20",
    startTime: "09:00 AM",
    endTime: "11:00 AM",
    duration: "2 hrs",
    payout: 50,
    status: "Completed",
    notes:
      "Administered morning medication and assisted with physiotherapy exercises. Elena is in good spirits.",
    location: "123 Maple St, Springfield",
    avatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
  },
  {
    id: "2",
    elderName: "Arthur Pendelton",
    careType: "Companionship",
    date: "2026-05-21",
    startTime: "01:00 PM",
    endTime: "05:00 PM",
    duration: "4 hrs",
    payout: 100,
    status: "Upcoming",
    notes: "Afternoon walk in the park and reading session.",
    location: "456 Oak Dr, Shelbyville",
    avatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
  },
  {
    id: "3",
    elderName: "Martha Simmons",
    careType: "Mobility Support",
    date: "2026-05-18",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    duration: "2 hrs",
    payout: 45,
    status: "Cancelled",
    notes: "Family requested cancellation due to schedule conflict.",
    location: "789 Pine Ave, Capital City",
    avatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
  },
  {
    id: "4",
    elderName: "John Doe",
    careType: "Medical Care",
    date: "2026-05-15",
    startTime: "08:00 AM",
    endTime: "12:00 PM",
    duration: "4 hrs",
    payout: 110,
    status: "Completed",
    notes: "Post-surgery checkup. Vitals are normal.",
    location: "321 Cedar Rd, Springfield",
    avatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
  },
  {
    id: "5",
    elderName: "Sarah Connor",
    careType: "Companionship",
    date: "2026-05-22",
    startTime: "02:00 PM",
    endTime: "04:00 PM",
    duration: "2 hrs",
    payout: 55,
    status: "Upcoming",
    notes: "Grocery shopping and general companionship.",
    location: "888 Elm St, Springfield",
    avatarUrl:
      "https://www.flaticon.com/free-icon/user_17701311?term=person&page=1&position=88&origin=search&related_id=17701311#",
  },
];

export const useSessionHistoryStore = create<SessionHistoryState>((set) => ({
  sessions: mockSessions,
  activeFilter: "All",
  searchQuery: "",
  sortBy: "newest",
  selectedSession: null,
  isLoading: false,

  setFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSelectedSession: (session) => set({ selectedSession: session }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
