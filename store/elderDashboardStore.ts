import { create } from "zustand";

import {
  ElderAccessibilityPreferences,
  ElderCaregiverProfile,
  ElderDashboardState,
  ElderRelativeContact,
  ElderReassuranceMessage,
} from "@/types/elder-dashboard";

const initialCaregiver: ElderCaregiverProfile = {
  id: "caregiver-emma",
  name: "Emma",
  careType: "Home support visit",
  role: "Primary caregiver",
  etaLabel: "Arriving in 12 minutes",
  note: "Emma is on the way and will check in when she arrives.",
  status: "Caregiver On The Way",
  progress: 58,
  avatarLabel: "EM",
};

const initialRelative: ElderRelativeContact = {
  id: "relative-daughter",
  name: "Sarah",
  relationship: "Daughter",
  phoneLabel: "Call Sarah",
  reassurance: "Sarah has emergency alerts turned on.",
  avatarLabel: "SA",
};

const reassuranceMessages: ElderReassuranceMessage[] = [
  {
    id: "reassure-1",
    tone: "calm",
    message: "Your caregiver is nearby and the visit is on track.",
  },
  {
    id: "reassure-2",
    tone: "reassuring",
    message: "Your family can see your alert and status updates.",
  },
  {
    id: "reassure-3",
    tone: "success",
    message: "Everything is okay. Help is ready if you need it.",
  },
  {
    id: "reassure-4",
    tone: "calm",
    message: "This screen is built for one-touch help and clear answers.",
  },
];

const initialAccessibility: ElderAccessibilityPreferences = {
  reduceMotion: false,
  largeText: true,
  highContrast: true,
  voiceFriendly: true,
};

export const useElderDashboardStore = create<ElderDashboardState>((set) => ({
  sessionStatus: "Caregiver On The Way",
  sosState: "idle",
  helpState: "idle",
  activeModal: null,
  caregiver: initialCaregiver,
  relative: initialRelative,
  reassuranceMessages,
  reassuranceIndex: 0,
  accessibility: initialAccessibility,
  setSessionStatus: (status) => set({ sessionStatus: status }),
  setSOSState: (state) => set({ sosState: state }),
  setHelpState: (state) => set({ helpState: state }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  requestSOS: () => set({ sosState: "confirming", activeModal: "sos-confirm" }),
  confirmSOS: () =>
    set({
      sosState: "sent",
      sessionStatus: "Caregiver On The Way",
      activeModal: "sos-sent",
      reassuranceIndex: 1,
    }),
  requestHelp: () =>
    set({ helpState: "confirming", activeModal: "help-confirm" }),
  confirmHelp: () =>
    set({
      helpState: "sent",
      activeModal: "help-sent",
      reassuranceIndex: 2,
    }),
  setReassuranceIndex: (index) => set({ reassuranceIndex: index }),
  advanceReassurance: () =>
    set((state) => ({
      reassuranceIndex:
        (state.reassuranceIndex + 1) % state.reassuranceMessages.length,
    })),
  setAccessibility: (preferences) =>
    set((state) => ({
      accessibility: {
        ...state.accessibility,
        ...preferences,
      },
    })),
  setCaregiver: (caregiver) => set({ caregiver }),
  setRelative: (relative) => set({ relative }),
}));
