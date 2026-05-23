import { memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  ElderCaregiverProfile,
  ElderSessionStatus,
} from "@/types/elder-dashboard";

import {
  ELDER_COLORS,
  ELDER_RADIUS,
  ELDER_SESSION_TONES,
  ELDER_SHADOW,
} from "../theme";

interface CareStatusCardProps {
  caregiver: ElderCaregiverProfile;
  sessionStatus: ElderSessionStatus;
  reducedMotion: boolean;
  onPress?: () => void;
}

function CareStatusCard({
  caregiver,
  sessionStatus,
  reducedMotion,
  onPress,
}: CareStatusCardProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1600 }),
        withTiming(1, { duration: 1600 }),
      ),
      -1,
      false,
    );
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const tone = ELDER_SESSION_TONES[sessionStatus];
  const isEmpty = sessionStatus === "No Active Session";

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(40).duration(380)}
      style={[
        styles.card,
        { backgroundColor: tone.background, borderColor: tone.border },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${sessionStatus}. ${caregiver.name}. ${caregiver.note}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.avatarWrap}>
          <Animated.View style={[styles.avatarCircle, pulseStyle]}>
            <Ionicons
              name="person-circle-outline"
              size={58}
              color={tone.text}
            />
          </Animated.View>
        </View>

        <View style={styles.headerCopy}>
          <View style={[styles.badge, { backgroundColor: tone.chip }]}>
            <Text style={styles.badgeText}>{tone.label}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {isEmpty ? "No active care session" : `${caregiver.name} is nearby`}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {isEmpty
              ? "We are waiting for a caregiver assignment."
              : caregiver.etaLabel}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Care progress</Text>
          <Text style={styles.progressValue}>{caregiver.progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(0, Math.min(100, caregiver.progress))}%`,
                backgroundColor: tone.chip,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.note}>{caregiver.note}</Text>

      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="View session details"
          style={styles.detailsButton}
        >
          <Text style={styles.detailsButtonText}>View session details</Text>
          <Ionicons name="chevron-forward" size={18} color={tone.chip} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export default memo(CareStatusCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: ELDER_RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    ...ELDER_SHADOW,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: ELDER_RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: ELDER_COLORS.surface,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: ELDER_COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
  },
  subtitle: {
    color: ELDER_COLORS.textSoft,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  progressSection: {
    marginTop: 16,
    gap: 10,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    color: ELDER_COLORS.textSoft,
    fontSize: 13,
    fontWeight: "800",
  },
  progressValue: {
    color: ELDER_COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  progressTrack: {
    height: 14,
    borderRadius: ELDER_RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.72)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: ELDER_RADIUS.pill,
  },
  note: {
    color: ELDER_COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 14,
    fontWeight: "700",
  },
  detailsButton: {
    marginTop: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: ELDER_RADIUS.pill,
    backgroundColor: ELDER_COLORS.surface,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsButtonText: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "900",
  },
});
