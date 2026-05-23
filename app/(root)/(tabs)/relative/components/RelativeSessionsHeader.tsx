import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants";
import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
} from "../theme";

interface QuickPill {
  key: string;
  label: string;
  count: number;
}

interface RelativeSessionsHeaderProps {
  totalSessions: number;
  activeSessions: number;
  upcomingSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  notificationsCount?: number;
  onOpenSearch?: () => void;
  onOpenSort?: () => void;
}

export const RelativeSessionsHeader: React.FC<RelativeSessionsHeaderProps> = ({
  totalSessions,
  activeSessions,
  upcomingSessions,
  completedSessions,
  cancelledSessions,
  notificationsCount = 0,
  onOpenSearch,
  onOpenSort,
}) => {
  const quickPills: QuickPill[] = [
    { key: "active", label: "Active", count: activeSessions },
    { key: "upcoming", label: "Upcoming", count: upcomingSessions },
    { key: "completed", label: "Completed", count: completedSessions },
    { key: "cancelled", label: "Cancelled", count: cancelledSessions },
  ];

  return (
    <LinearGradient
      colors={RELATIVE_GRADIENTS.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.titlesBlock}>
          <Text style={styles.title}>Care Sessions</Text>
          <Text style={styles.subtitle}>
            {totalSessions} total bookings monitored
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Search sessions"
            onPress={onOpenSearch}
          >
            <Image source={icons.search} style={styles.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Filter and sort sessions"
            onPress={onOpenSort}
          >
            <Image source={icons.list} style={styles.icon} />
          </TouchableOpacity>

          <View style={styles.badgeWrap}>
            <Image source={icons.notification} style={styles.icon} />
            {notificationsCount > 0 && (
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>{totalSessions}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active</Text>
          <Text style={styles.summaryValue}>{activeSessions}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Upcoming</Text>
          <Text style={styles.summaryValue}>{upcomingSessions}</Text>
        </View>
      </View>

      <View style={styles.pillsRow}>
        {quickPills.map((pill) => (
          <View key={pill.key} style={styles.pill}>
            <Text style={styles.pillLabel}>{pill.label}</Text>
            <Text style={styles.pillCount}>{pill.count}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: "#0d5c63",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 7,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titlesBlock: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "500",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badgeWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  icon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
  },
  badgeDot: {
    position: "absolute",
    right: 4,
    top: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: RELATIVE_RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    fontWeight: "600",
  },
  summaryValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 1,
  },
  pillsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  pillLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  pillCount: {
    minWidth: 20,
    textAlign: "center",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: "rgba(255,255,255,0.24)",
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
  },
});
