import React, { memo, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

import { RelativeElderProfile } from "@/types/relative-dashboard";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface ElderStatusCardProps {
  elder: RelativeElderProfile;
}

function ElderStatusCard({ elder }: ElderStatusCardProps) {
  const [expanded, setExpanded] = useState(false);

  const alertTone = useMemo(() => {
    if (elder.alertLevel === "attention") {
      return {
        background: RELATIVE_COLORS.dangerSoft,
        color: RELATIVE_COLORS.danger,
      };
    }

    if (elder.alertLevel === "watch") {
      return { background: "#fff8e8", color: RELATIVE_COLORS.warning };
    }

    return {
      background: RELATIVE_COLORS.surfaceTint,
      color: RELATIVE_COLORS.tealDark,
    };
  }, [elder.alertLevel]);

  return (
    <Animated.View
      entering={FadeInDown.delay(220).duration(420)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={icons.woman} style={styles.avatar} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Elder status</Text>
          <Text style={styles.name}>{elder.name}</Text>
          <Text style={styles.relationship}>{elder.relationship}</Text>
        </View>
        <View
          style={[styles.alertPill, { backgroundColor: alertTone.background }]}
        >
          <View
            style={[styles.alertDot, { backgroundColor: alertTone.color }]}
          />
          <Text style={[styles.alertText, { color: alertTone.color }]}>
            {elder.emergencyStatus}
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Mobility</Text>
          <Text style={styles.metricValue}>{elder.mobilityLevel}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Last check-in</Text>
          <Text style={styles.metricValue}>{elder.lastCheckIn}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Medication reminder</Text>
          <Text style={styles.metricValue}>{elder.medicationReminder}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Care status</Text>
          <Text style={styles.metricValue}>{elder.currentCareStatus}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.expander}
        onPress={() => setExpanded((current) => !current)}
      >
        <Text style={styles.expanderText}>
          {expanded ? "Hide wellness note" : "Show wellness note"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={RELATIVE_COLORS.tealDark}
        />
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Wellness summary</Text>
          <Text style={styles.noteText}>{elder.healthNote}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default memo(ElderStatusCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 18,
    marginBottom: 18,
    ...RELATIVE_SHADOW,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    tintColor: RELATIVE_COLORS.deepTeal,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: RELATIVE_COLORS.teal,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  relationship: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  alertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "800",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48.2%",
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
  },
  metricLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: "700",
  },
  metricValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  expander: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  expanderText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 13,
    fontWeight: "800",
  },
  noteBox: {
    marginTop: 8,
    backgroundColor: "#f7fbfb",
    borderRadius: RELATIVE_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  noteLabel: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  noteText: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    lineHeight: 20,
  },
});
