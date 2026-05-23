import { ElderSessionStatus } from "@/types/elder-dashboard";

export const ELDER_COLORS = {
  background: "#eef9f6",
  surface: "#ffffff",
  surfaceSoft: "#e5f7f1",
  surfaceMuted: "#d9f0ea",
  border: "#c6e6dd",
  text: "#12322f",
  textSoft: "#4a6662",
  muted: "#5f7571",
  primary: "#13856f",
  primaryDark: "#0d6a59",
  primarySoft: "#d6f5eb",
  danger: "#d6473f",
  dangerDark: "#b92f28",
  dangerSoft: "#ffe9e7",
  warning: "#b67a15",
  success: "#167a4f",
  successSoft: "#ddf6eb",
  shadow: "#0d5c4d",
};

export const ELDER_GRADIENTS = {
  header: ["#dff7f0", "#f7fcfb"],
  calming: ["#f3fbf8", "#e8f8f2"],
  danger: ["#ffe5e2", "#fff7f7"],
};

export const ELDER_RADIUS = {
  xl: 32,
  lg: 24,
  md: 18,
  sm: 14,
  pill: 999,
};

export const ELDER_SHADOW = {
  shadowColor: ELDER_COLORS.shadow,
  shadowOpacity: 0.12,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 8 },
  elevation: 7,
};

export const ELDER_SESSION_TONES: Record<
  ElderSessionStatus,
  {
    background: string;
    border: string;
    text: string;
    chip: string;
    label: string;
  }
> = {
  "No Active Session": {
    background: "#f1f7f5",
    border: "#d7e7e2",
    text: ELDER_COLORS.text,
    chip: ELDER_COLORS.muted,
    label: "Waiting",
  },
  "Caregiver Assigned": {
    background: ELDER_COLORS.primarySoft,
    border: "#bfe9db",
    text: ELDER_COLORS.primaryDark,
    chip: ELDER_COLORS.primaryDark,
    label: "Assigned",
  },
  "Caregiver On The Way": {
    background: ELDER_COLORS.primarySoft,
    border: "#bfe9db",
    text: ELDER_COLORS.primaryDark,
    chip: ELDER_COLORS.primaryDark,
    label: "On the way",
  },
  "Caregiver Arrived": {
    background: ELDER_COLORS.successSoft,
    border: "#c8edd9",
    text: ELDER_COLORS.success,
    chip: ELDER_COLORS.success,
    label: "Arrived",
  },
  "Active Care In Progress": {
    background: "#ebfaf5",
    border: "#bde7d7",
    text: ELDER_COLORS.primaryDark,
    chip: ELDER_COLORS.primaryDark,
    label: "Active",
  },
  "Session Completed": {
    background: "#edf7fb",
    border: "#d2e8f0",
    text: "#14516a",
    chip: "#14516a",
    label: "Complete",
  },
};

export const ELDER_MODAL_TONES = {
  danger: {
    accent: ELDER_COLORS.danger,
    background: ELDER_COLORS.dangerSoft,
    text: ELDER_COLORS.text,
  },
  calm: {
    accent: ELDER_COLORS.primary,
    background: ELDER_COLORS.primarySoft,
    text: ELDER_COLORS.text,
  },
  success: {
    accent: ELDER_COLORS.success,
    background: ELDER_COLORS.successSoft,
    text: ELDER_COLORS.text,
  },
} as const;
