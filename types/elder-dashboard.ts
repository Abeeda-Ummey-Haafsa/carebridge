export type ElderSessionStatus =
  | "No Active Session"
  | "Caregiver Assigned"
  | "Caregiver On The Way"
  | "Caregiver Arrived"
  | "Active Care In Progress"
  | "Session Completed";

export type ElderModalKind =
  | "sos-confirm"
  | "sos-sent"
  | "help-confirm"
  | "help-sent"
  | "caregiver-arriving"
  | "relative-contact"
  | null;

export type ElderAlertTone = "calm" | "reassuring" | "success" | "danger";

export interface ElderCaregiverProfile {
  id: string;
  name: string;
  careType: string;
  role: string;
  etaLabel: string;
  note: string;
  status: ElderSessionStatus;
  progress: number;
  avatarLabel: string;
}

export interface ElderRelativeContact {
  id: string;
  name: string;
  relationship: string;
  phoneLabel: string;
  reassurance: string;
  avatarLabel: string;
}

export interface ElderReassuranceMessage {
  id: string;
  tone: ElderAlertTone;
  message: string;
}

export interface ElderAccessibilityPreferences {
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  voiceFriendly: boolean;
}

export interface ElderDashboardState {
  sessionStatus: ElderSessionStatus;
  sosState: "idle" | "confirming" | "sent";
  helpState: "idle" | "confirming" | "sent";
  activeModal: ElderModalKind;
  caregiver: ElderCaregiverProfile;
  relative: ElderRelativeContact;
  reassuranceMessages: ElderReassuranceMessage[];
  reassuranceIndex: number;
  accessibility: ElderAccessibilityPreferences;
  setSessionStatus: (status: ElderSessionStatus) => void;
  setSOSState: (state: ElderDashboardState["sosState"]) => void;
  setHelpState: (state: ElderDashboardState["helpState"]) => void;
  setActiveModal: (modal: ElderModalKind) => void;
  requestSOS: () => void;
  confirmSOS: () => void;
  requestHelp: () => void;
  confirmHelp: () => void;
  setReassuranceIndex: (index: number) => void;
  advanceReassurance: () => void;
  setAccessibility: (
    preferences: Partial<ElderAccessibilityPreferences>,
  ) => void;
  setCaregiver: (caregiver: ElderCaregiverProfile) => void;
  setRelative: (relative: ElderRelativeContact) => void;
}
