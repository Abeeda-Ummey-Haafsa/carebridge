import React, { memo, useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

import {
  RelativeDashboardSummary,
  RelativeElderProfile,
} from "@/types/relative-dashboard";

import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface DashboardHeaderProps {
  userName: string;
  selectedElder: RelativeElderProfile;
  elderCount: number;
  summary: RelativeDashboardSummary;
  scrollY: SharedValue<number>;
  onSwitchElder: () => void;
  onOpenNotifications: () => void;
  onOpenEmergencyCenter: () => void;
}

function DashboardHeader({
  userName,
  selectedElder,
  elderCount,
  summary,
  scrollY,
  onSwitchElder,
  onOpenNotifications,
  onOpenEmergencyCenter,
}: DashboardHeaderProps) {
  const notificationPulse = useSharedValue(1);

  useEffect(() => {
    notificationPulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 850 }),
        withTiming(1, { duration: 850 }),
      ),
      -1,
      false,
    );
  }, [notificationPulse]);

  const shellStyle = useAnimatedStyle(() => {
    const compact = interpolate(scrollY.value, [0, 120], [0, 1]);
    return {
      transform: [
        { translateY: interpolate(scrollY.value, [0, 120], [0, -2]) },
      ],
      paddingBottom: interpolate(scrollY.value, [0, 120], [18, 10]),
      paddingTop: interpolate(scrollY.value, [0, 120], [18, 12]),
      borderBottomLeftRadius: interpolate(
        scrollY.value,
        [0, 120],
        [RELATIVE_RADIUS.xl, RELATIVE_RADIUS.lg],
      ),
      borderBottomRightRadius: interpolate(
        scrollY.value,
        [0, 120],
        [RELATIVE_RADIUS.xl, RELATIVE_RADIUS.lg],
      ),
      opacity: 1 - compact * 0.04,
    };
  });

  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 90], [1, 0]),
    maxHeight: interpolate(scrollY.value, [0, 90], [110, 0]),
    marginTop: interpolate(scrollY.value, [0, 90], [14, 0]),
  }));

  const compactStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [0, 1]),
    transform: [{ translateY: interpolate(scrollY.value, [0, 100], [10, 0]) }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationPulse.value }],
  }));

  return (
    <LinearGradient
      colors={RELATIVE_GRADIENTS.header}
      style={styles.gradientShell}
    >
      <Animated.View style={[styles.card, shellStyle]}>
        <View style={styles.topRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.kicker}>Relative dashboard</Text>
            <Text style={styles.greeting}>Good Morning, {userName}</Text>
            <Text style={styles.subtitle}>
              {summary.activeSessions} live care session
              {summary.activeSessions === 1 ? "" : "s"} are being tracked.
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={onOpenEmergencyCenter}
              accessibilityRole="button"
              accessibilityLabel="Open emergency center"
            >
              <Ionicons name="warning-outline" size={20} color="#fff" />
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>
                  {summary.emergencyAlerts}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={onOpenNotifications}
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
            >
              <Animated.View style={pulseStyle}>
                <Image source={icons.notification} style={styles.iconImage} />
              </Animated.View>
              <Animated.View style={[styles.notificationDot, pulseStyle]} />
            </TouchableOpacity>

            <View style={styles.profileCircle}>
              <Image source={icons.profile} style={styles.profileImage} />
            </View>
          </View>
        </View>

        <Animated.View style={[styles.detailRow, detailStyle]}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.switcherCard}
            onPress={onSwitchElder}
            accessibilityRole="button"
            accessibilityLabel="Switch elder profile"
          >
            <View style={styles.switcherAvatar}>
              <Text style={styles.switcherAvatarText}>
                {selectedElder.avatarLabel}
              </Text>
            </View>
            <View style={styles.switcherTextBlock}>
              <Text style={styles.switcherLabel}>Active elder</Text>
              <Text style={styles.switcherValue}>{selectedElder.name}</Text>
              <Text style={styles.switcherSub}>
                {selectedElder.relationship}
              </Text>
            </View>
            <Image source={icons.arrowDown} style={styles.chevron} />
          </TouchableOpacity>

          <View style={styles.metaGrid}>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {summary.liveUpdates > 0 ? "Today" : "—"}
              </Text>
            </View>
            <View style={styles.metaCard}>
              <Text style={styles.metaLabel}>Care activity</Text>
              <Text style={styles.metaValue}>
                {summary.liveUpdates} updates
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.compactRow, compactStyle]}>
          <View>
            <Text style={styles.compactTitle}>{selectedElder.name}</Text>
            <Text style={styles.compactSubtitle}>
              {elderCount} elder profiles linked
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.compactSwitcher}
            onPress={onSwitchElder}
          >
            <Text style={styles.compactSwitcherText}>Switch</Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color={RELATIVE_COLORS.deepTeal}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

export default memo(DashboardHeader);

const styles = StyleSheet.create({
  gradientShell: {
    borderBottomLeftRadius: RELATIVE_RADIUS.xl,
    borderBottomRightRadius: RELATIVE_RADIUS.xl,
    marginBottom: 18,
    overflow: "hidden",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 18,
    ...RELATIVE_SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  greetingBlock: {
    flex: 1,
    paddingRight: 8,
  },
  kicker: {
    color: "#daf7f1",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  greeting: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#e4fbf7",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 20,
    height: 20,
    tintColor: "#ffffff",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: RELATIVE_COLORS.danger,
  },
  emergencyBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: RELATIVE_COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: RELATIVE_COLORS.deepTeal,
  },
  emergencyBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  profileCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  profileImage: {
    width: 28,
    height: 28,
    tintColor: "#ffffff",
  },
  detailRow: {
    overflow: "hidden",
  },
  switcherCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  switcherAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  switcherAvatarText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  switcherTextBlock: {
    flex: 1,
  },
  switcherLabel: {
    color: "#d8f7f2",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  switcherValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  switcherSub: {
    color: "#e6f8f5",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    width: 12,
    height: 12,
    tintColor: "#fff",
  },
  metaGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  metaCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  metaLabel: {
    color: "#dcf7f3",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  metaValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  compactRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RELATIVE_RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  compactTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  compactSubtitle: {
    color: "#e7fbf7",
    fontSize: 11,
    marginTop: 1,
  },
  compactSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  compactSwitcherText: {
    color: RELATIVE_COLORS.deepTeal,
    fontWeight: "800",
    fontSize: 12,
  },
});
