import {
  RelativeActiveSession,
  RelativeActivityUpdate,
  RelativeAlertType,
  RelativeBooking,
  RelativeCareOption,
  RelativeEmergencyAlert,
  RelativeElderProfile,
} from "@/types/relative-dashboard";

export const RELATIVE_ELDERS: RelativeElderProfile[] = [
  {
    id: "elder-elena",
    name: "Elena Rodriguez",
    relationship: "Mother",
    avatarLabel: "ER",
    mobilityLevel: "Moderate support",
    currentCareStatus: "Receiving active medical care",
    lastCheckIn: "12 min ago",
    medicationReminder: "9:00 PM tonight",
    emergencyStatus: "Safe and monitored",
    healthNote: "Vitals are stable and the current care plan is on track.",
    alertLevel: "safe",
  },
  {
    id: "elder-arthur",
    name: "Arthur Pendelton",
    relationship: "Father",
    avatarLabel: "AP",
    mobilityLevel: "Light assistance",
    currentCareStatus: "Scheduled for evening companionship",
    lastCheckIn: "48 min ago",
    medicationReminder: "8:15 PM tonight",
    emergencyStatus: "Low risk",
    healthNote: "A calm afternoon with a confirmed caregiver handoff.",
    alertLevel: "watch",
  },
  {
    id: "elder-maria",
    name: "Maria Chen",
    relationship: "Aunt",
    avatarLabel: "MC",
    mobilityLevel: "Independent with reminders",
    currentCareStatus: "Upcoming mobility support",
    lastCheckIn: "1 hr ago",
    medicationReminder: "Tomorrow, 8:00 AM",
    emergencyStatus: "Stable",
    healthNote:
      "No urgent issues. The next session is scheduled and confirmed.",
    alertLevel: "safe",
  },
];

export const RELATIVE_ACTIVE_SESSIONS: RelativeActiveSession[] = [
  {
    id: "session-elena",
    elderId: "elder-elena",
    caregiverName: "Ava Thompson",
    caregiverRole: "Registered caregiver",
    elderName: "Elena Rodriguez",
    careType: "Medical Assistance",
    status: "Active session",
    timer: "01:14:23",
    duration: "2 hrs",
    eta: "Ends in 45 min",
    progress: 68,
    mapLabel: "Live care route preview",
  },
];

export const QUICK_CARE_OPTIONS: RelativeCareOption[] = [
  {
    id: "companionship",
    title: "Companionship",
    subtitle: "Friendly visits and support",
  },
  {
    id: "medical",
    title: "Medical Assistance",
    subtitle: "Vitals, meds, and health support",
  },
  {
    id: "mobility",
    title: "Mobility Assistance",
    subtitle: "Safe movement and transfers",
  },
  {
    id: "overnight",
    title: "Overnight Care",
    subtitle: "All-night peace of mind",
  },
];

export const UPCOMING_BOOKINGS: RelativeBooking[] = [
  {
    id: "booking-1",
    elderId: "elder-elena",
    caregiverName: "Ava Thompson",
    elderName: "Elena Rodriguez",
    careType: "Medical Assistance",
    dateLabel: "Today",
    timeLabel: "6:30 PM",
    duration: "2 hrs",
    status: "Confirmed",
    rating: "4.9",
    countdown: "Starts in 2h 18m",
    timelineLabel: "Evening care",
  },
  {
    id: "booking-2",
    elderId: "elder-arthur",
    caregiverName: "Priya Nair",
    elderName: "Arthur Pendelton",
    careType: "Companionship",
    dateLabel: "Tomorrow",
    timeLabel: "2:00 PM",
    duration: "3 hrs",
    status: "Scheduled",
    rating: "4.8",
    countdown: "Starts in 1d 3h",
    timelineLabel: "Afternoon visit",
  },
  {
    id: "booking-3",
    elderId: "elder-maria",
    caregiverName: "Nora Williams",
    elderName: "Maria Chen",
    careType: "Mobility Assistance",
    dateLabel: "Fri, May 24",
    timeLabel: "9:00 AM",
    duration: "1.5 hrs",
    status: "In Review",
    rating: "4.7",
    countdown: "Pending confirmation",
    timelineLabel: "Morning support",
  },
];

export const ELDER_ACTIVITY_UPDATES: RelativeActivityUpdate[] = [
  {
    id: "update-1",
    elderId: "elder-elena",
    caregiverName: "Ava Thompson",
    message: "Medication administered and recorded in the care log.",
    timestamp: "8 min ago",
    reference: "Session #1284",
  },
  {
    id: "update-2",
    elderId: "elder-elena",
    caregiverName: "Ava Thompson",
    message: "Meal completed and hydration intake looks on target.",
    timestamp: "22 min ago",
    reference: "Meal check",
  },
  {
    id: "update-3",
    elderId: "elder-arthur",
    caregiverName: "Priya Nair",
    message: "Session checked in and safety scan completed.",
    timestamp: "1 hr ago",
    reference: "Session #1261",
  },
  {
    id: "update-4",
    elderId: "elder-maria",
    caregiverName: "Nora Williams",
    message: "Blood pressure monitored and wellness note updated.",
    timestamp: "2 hrs ago",
    reference: "Vitals review",
  },
];

export const EMERGENCY_ALERTS: RelativeEmergencyAlert[] = [
  {
    id: "alert-1",
    elderId: "all",
    type: "Missed Check-in",
    title: "Caregiver check-in due soon",
    message: "The evening session is due for its next status update.",
    priority: "medium",
    actionLabel: "Review session",
  },
  {
    id: "alert-2",
    elderId: "elder-elena",
    type: "SOS",
    title: "Emergency center ready",
    message: "Tap to access emergency contact shortcuts and the support line.",
    priority: "high",
    actionLabel: "Open SOS center",
  },
];

export const ALERT_LABELS: Record<RelativeAlertType, string> = {
  SOS: "SOS",
  "Need Help": "Need Help",
  "Session Delayed": "Session Delayed",
  "Missed Check-in": "Missed Check-in",
};
