import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ElderCaregiverProfile } from "@/types/elder-dashboard";

import {
  ELDER_COLORS,
  ELDER_RADIUS,
  ELDER_SESSION_TONES,
  ELDER_SHADOW,
} from "../theme";

interface CaregiverInfoCardProps {
  caregiver: ElderCaregiverProfile;
  onCallRelative: () => void;
  onViewSession: () => void;
}

function CaregiverInfoCard({
  caregiver,
  onCallRelative,
  onViewSession,
}: CaregiverInfoCardProps) {
  const tone = ELDER_SESSION_TONES[caregiver.status];

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Ionicons
            name="person-circle-outline"
            size={48}
            color={ELDER_COLORS.primaryDark}
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.kicker}>Caregiver</Text>
          <Text style={styles.name}>{caregiver.name}</Text>
          <Text style={styles.meta}>{caregiver.role}</Text>
          <Text style={styles.meta}>{caregiver.careType}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
          <Text style={[styles.statusText, { color: tone.chip }]}>
            {tone.label}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>ETA</Text>
          <Text style={styles.detailValue}>{caregiver.etaLabel}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Session</Text>
          <Text style={styles.detailValue}>{caregiver.status}</Text>
        </View>
      </View>

      <Text style={styles.note}>{caregiver.note}</Text>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onCallRelative}
          accessibilityRole="button"
          accessibilityLabel="Call relative"
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons name="call" size={18} color={ELDER_COLORS.primaryDark} />
          <Text style={styles.actionText}>Call Relative</Text>
        </Pressable>

        <Pressable
          onPress={onViewSession}
          accessibilityRole="button"
          accessibilityLabel="View session status"
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionPressed,
          ]}
        >
          <Ionicons
            name="information-circle"
            size={18}
            color={ELDER_COLORS.primaryDark}
          />
          <Text style={styles.actionText}>View Session</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default memo(CaregiverInfoCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: ELDER_COLORS.surface,
    borderRadius: ELDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    padding: 18,
    marginBottom: 16,
    ...ELDER_SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELDER_COLORS.surfaceSoft,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: {
    color: ELDER_COLORS.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
  },
  meta: {
    color: ELDER_COLORS.textSoft,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  statusPill: {
    borderRadius: ELDER_RADIUS.pill,
    minHeight: 38,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  detailRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  detailItem: {
    flex: 1,
    borderRadius: ELDER_RADIUS.md,
    backgroundColor: ELDER_COLORS.surfaceSoft,
    padding: 12,
  },
  detailLabel: {
    color: ELDER_COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  detailValue: {
    color: ELDER_COLORS.text,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    marginTop: 4,
  },
  note: {
    color: ELDER_COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 14,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: ELDER_RADIUS.pill,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    backgroundColor: ELDER_COLORS.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionPressed: {
    opacity: 0.92,
  },
  actionText: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 14,
    fontWeight: "900",
  },
});
