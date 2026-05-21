export type RelativeAlertType =
  | "SOS"
  | "Need Help"
  | "Session Delayed"
  | "Missed Check-in";

export type RelativeSessionStatus =
  | "Caregiver en route"
  | "Checked in"
  | "Active session"
  | "Session ending soon";

export type RelativeBookingStatus =
  | "Confirmed"
  | "Scheduled"
  | "In Review"
  | "Needs Confirmation";

export type RelativeEmergencyPriority = "high" | "medium" | "low";

export interface RelativeDashboardSummary {
  activeElders: number;
  activeSessions: number;
  upcomingBookings: number;
  nearbyCaregivers: number;
  unreadNotifications: number;
  emergencyAlerts: number;
  liveUpdates: number;
}

export interface RelativeElderProfile {
  id: string;
  name: string;
  relationship: string;
  avatarLabel: string;
  mobilityLevel: string;
  currentCareStatus: string;
  lastCheckIn: string;
  medicationReminder: string;
  emergencyStatus: string;
  healthNote: string;
  alertLevel: "safe" | "watch" | "attention";
}

export interface RelativeActiveSession {
  id: string;
  elderId: string;
  caregiverName: string;
  caregiverRole: string;
  elderName: string;
  careType: string;
  status: RelativeSessionStatus;
  timer: string;
  duration: string;
  eta: string;
  progress: number;
  mapLabel: string;
}

export interface RelativeBooking {
  id: string;
  elderId: string;
  caregiverName: string;
  elderName: string;
  careType: string;
  dateLabel: string;
  timeLabel: string;
  duration: string;
  status: RelativeBookingStatus;
  rating: string;
  countdown: string;
  timelineLabel: string;
}

export interface RelativeActivityUpdate {
  id: string;
  elderId: string;
  caregiverName: string;
  message: string;
  timestamp: string;
  reference: string;
}

export interface RelativeEmergencyAlert {
  id: string;
  elderId: string | "all";
  type: RelativeAlertType;
  title: string;
  message: string;
  priority: RelativeEmergencyPriority;
  actionLabel: string;
}

export interface RelativeCareOption {
  id: string;
  title: string;
  subtitle: string;
}
