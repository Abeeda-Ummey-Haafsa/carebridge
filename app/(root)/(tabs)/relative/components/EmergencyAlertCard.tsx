import React, { memo, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RelativeEmergencyAlert } from "@/types/relative-dashboard";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface EmergencyAlertCardProps {
  alerts: RelativeEmergencyAlert[];
  onPressAlert: (alert: RelativeEmergencyAlert) => void;
}

function EmergencyAlertCard({ alerts, onPressAlert }: EmergencyAlertCardProps) {
  const [expanded, setExpanded] = useState(true);

  const displayAlerts = useMemo(() => alerts.slice(0, 2), [alerts]);

  if (!displayAlerts.length) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(300).duration(400)}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Urgent alerts</Text>
          <Text style={styles.title}>Emergency & SOS Alerts</Text>
        </View>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setExpanded((value) => !value)}
        >
          <Text style={styles.toggleText}>
            {expanded ? "Collapse" : "Expand"}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={RELATIVE_COLORS.deepTeal}
          />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.alertStack}>
          {displayAlerts.map((alert, index) => {
            const tone =
              alert.priority === "high"
                ? {
                    background: RELATIVE_COLORS.dangerSoft,
                    color: RELATIVE_COLORS.danger,
                  }
                : alert.priority === "medium"
                  ? { background: "#fff8e8", color: RELATIVE_COLORS.warning }
                  : {
                      background: RELATIVE_COLORS.surfaceTint,
                      color: RELATIVE_COLORS.tealDark,
                    };

            return (
              <View
                key={alert.id}
                style={[styles.alertCard, { backgroundColor: tone.background }]}
              >
                <View style={styles.alertTopRow}>
                  <View style={styles.alertBadgeRow}>
                    <View
                      style={[styles.pulseDot, { backgroundColor: tone.color }]}
                    />
                    <Text style={[styles.alertType, { color: tone.color }]}>
                      {alert.type}
                    </Text>
                  </View>
                  <Text style={styles.priorityText}>
                    {alert.priority.toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertMessage}>{alert.message}</Text>

                <TouchableOpacity
                  style={styles.alertAction}
                  onPress={() => onPressAlert(alert)}
                >
                  <Text style={styles.alertActionText}>
                    {alert.actionLabel}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={tone.color} />
                </TouchableOpacity>

                {index < displayAlerts.length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default memo(EmergencyAlertCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 18,
    marginBottom: 18,
    ...RELATIVE_SHADOW,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: RELATIVE_COLORS.danger,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  toggleText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 11,
    fontWeight: "800",
  },
  alertStack: {
    gap: 12,
  },
  alertCard: {
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  alertTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  alertBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  alertType: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  priorityText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  alertTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  alertMessage: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  alertAction: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertActionText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 13,
    fontWeight: "800",
  },
  divider: {
    marginTop: 14,
    height: 1,
    backgroundColor: RELATIVE_COLORS.border,
  },
});
