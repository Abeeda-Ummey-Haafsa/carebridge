import React, { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";
import { LinearGradient } from "expo-linear-gradient";

import { RelativeActiveSession } from "@/types/relative-dashboard";

import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface ActiveSessionCardProps {
  session?: RelativeActiveSession;
  onViewLiveSession: () => void;
  onOpenChat: () => void;
  onEmergencyContact: () => void;
}

function ActiveSessionCard({
  session,
  onViewLiveSession,
  onOpenChat,
  onEmergencyContact,
}: ActiveSessionCardProps) {
  if (!session) {
    return (
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={styles.emptyCard}
      >
        <View style={styles.emptyHeader}>
          <View style={styles.emptyPulse} />
          <Text style={styles.emptyTitle}>No active session right now</Text>
        </View>
        <Text style={styles.emptyText}>
          Once a caregiver checks in, the live session card will appear here.
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(80).duration(420)}
      style={styles.cardShell}
    >
      <LinearGradient
        colors={RELATIVE_GRADIENTS.tealSurface}
        style={styles.card}
      >
        <View style={styles.headerRow}>
          <View style={styles.caregiverRow}>
            <View style={styles.avatarCircle}>
              <Image source={icons.man} style={styles.avatarImage} />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.label}>Live care session</Text>
              <Text style={styles.name}>{session.caregiverName}</Text>
              <Text style={styles.subLabel}>{session.caregiverRole}</Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{session.status}</Text>
          </View>
        </View>

        <View style={styles.sessionBody}>
          <View style={styles.sessionInfo}>
            <Text style={styles.elderName}>{session.elderName}</Text>
            <Text style={styles.sessionType}>{session.careType}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={RELATIVE_COLORS.teal}
                />
                <Text style={styles.metaChipText}>{session.duration}</Text>
              </View>
              <View style={styles.metaChip}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={RELATIVE_COLORS.teal}
                />
                <Text style={styles.metaChipText}>{session.eta}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timerBox}>
            <Text style={styles.timer}>{session.timer}</Text>
            <Text style={styles.timerLabel}>Live timer</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${session.progress}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>{session.progress}% complete</Text>
        </View>

        <View style={styles.mapPreview}>
          <View style={styles.mapGrid}>
            <View style={[styles.mapLine, { top: 10 }]} />
            <View style={[styles.mapLine, { top: 28 }]} />
            <View style={[styles.mapLine, { top: 46 }]} />
            <View style={[styles.mapLineVertical, { left: 22 }]} />
            <View style={[styles.mapLineVertical, { left: 48 }]} />
          </View>
          <View style={styles.mapPin}>
            <Ionicons name="location-sharp" size={16} color="#fff" />
          </View>
          <Text style={styles.mapLabel}>{session.mapLabel}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            activeOpacity={0.9}
            onPress={onViewLiveSession}
          >
            <Text style={styles.primaryActionText}>View Live Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            activeOpacity={0.9}
            onPress={onOpenChat}
          >
            <Text style={styles.secondaryActionText}>Open Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.emergencyAction}
            activeOpacity={0.9}
            onPress={onEmergencyContact}
          >
            <Text style={styles.emergencyActionText}>Emergency Contact</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default memo(ActiveSessionCard);

const styles = StyleSheet.create({
  cardShell: {
    borderRadius: RELATIVE_RADIUS.xl,
    marginBottom: 18,
    overflow: "hidden",
    ...RELATIVE_SHADOW,
  },
  card: {
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 18,
  },
  caregiverRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  avatarImage: {
    width: 28,
    height: 28,
    tintColor: "#fff",
  },
  titleBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#d8f7f2",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  subLabel: {
    color: "#ecfffc",
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sessionBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  elderName: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sessionType: {
    color: "#effdfb",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  metaChipText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  timerBox: {
    minWidth: 102,
    alignItems: "flex-end",
  },
  timer: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  timerLabel: {
    color: "#dcf7f3",
    fontSize: 11,
    marginTop: 3,
  },
  progressBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  progressLabel: {
    color: "#e6f8f5",
    fontSize: 11,
    fontWeight: "700",
  },
  mapPreview: {
    height: 120,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    marginBottom: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
  },
  mapLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  mapLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  mapPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RELATIVE_COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.8)",
  },
  mapLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 8,
    backgroundColor: "rgba(13,92,99,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryAction: {
    flexGrow: 1,
    minWidth: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryActionText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  emergencyAction: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  emergencyActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCard: {
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 18,
    backgroundColor: RELATIVE_COLORS.surface,
    marginBottom: 18,
    ...RELATIVE_SHADOW,
  },
  emptyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  emptyPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RELATIVE_COLORS.soft,
  },
  emptyTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
