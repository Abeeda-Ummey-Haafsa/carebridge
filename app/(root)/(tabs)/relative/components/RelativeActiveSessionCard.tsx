import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants";
import { RelativeCareSession } from "@/store/relativeSessionsStore";
import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
} from "../theme";

interface RelativeActiveSessionCardProps {
  session: RelativeCareSession;
  onViewLive?: () => void;
  onOpenChat?: () => void;
  onEmergency?: () => void;
  onViewUpdates?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

export const RelativeActiveSessionCard: React.FC<
  RelativeActiveSessionCardProps
> = ({ session, onViewLive, onOpenChat, onEmergency, onViewUpdates }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.18],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.34, 0],
  });

  const progress = Math.round(session.progress ?? 64);

  return (
    <LinearGradient
      colors={RELATIVE_GRADIENTS.booking}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.pulseWrap} pointerEvents="none">
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      </View>

      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>Active Session</Text>
          <Text style={styles.subtitle}>
            {(session.caregiverStatus ?? "active care").toUpperCase()}
          </Text>
        </View>

        <View style={styles.timerBadge}>
          <Text style={styles.timerLabel}>Live Timer</Text>
          <Text style={styles.timerValue}>01:23:18</Text>
        </View>
      </View>

      <View style={styles.peopleGrid}>
        <View style={styles.personCard}>
          <Image
            source={{ uri: session.caregiverAvatarUrl }}
            style={styles.avatar}
          />
          <View style={styles.personBody}>
            <Text style={styles.personTag}>Caregiver</Text>
            <Text style={styles.personName}>{session.caregiverName}</Text>
            <Text style={styles.personMeta}>ETA {session.eta ?? "5 mins"}</Text>
          </View>
        </View>

        <View style={styles.personCard}>
          <Image
            source={{ uri: session.elderAvatarUrl }}
            style={styles.avatar}
          />
          <View style={styles.personBody}>
            <Text style={styles.personTag}>Elder</Text>
            <Text style={styles.personName}>{session.elderName}</Text>
            <Text style={styles.personMeta}>{session.careType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Session Cost</Text>
          <Text style={styles.metricValue}>{formatCurrency(session.cost)}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>Window</Text>
          <Text style={styles.metricValue}>
            {session.startTime} - {session.endTime}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTitleRow}>
          <Text style={styles.progressLabel}>Session Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.max(6, progress)}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={onViewLive}
        >
          <Image source={icons.map} style={styles.primaryIcon} />
          <Text style={styles.primaryBtnText}>View Live</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onOpenChat}>
          <Image source={icons.chat} style={styles.secondaryIcon} />
          <Text style={styles.secondaryBtnText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onEmergency}>
          <Image source={icons.call} style={styles.secondaryIcon} />
          <Text style={styles.secondaryBtnText}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onViewUpdates}>
          <Image source={icons.notification} style={styles.secondaryIcon} />
          <Text style={styles.secondaryBtnText}>Updates</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: 14,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#0c4f57",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 14,
    elevation: 8,
  },
  pulseWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 86,
  },
  timerLabel: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 10,
    fontWeight: "600",
  },
  timerValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 1,
  },
  peopleGrid: {
    marginTop: 12,
    gap: 8,
  },
  personCard: {
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  personBody: {
    marginLeft: 10,
    flex: 1,
  },
  personTag: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "600",
  },
  personName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  personMeta: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    marginTop: 1,
  },
  metricsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  metricCell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  metricLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
  },
  metricValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  progressRow: {
    marginTop: 10,
  },
  progressTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 11,
    fontWeight: "600",
  },
  progressValue: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  actionBtn: {
    minWidth: "23%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  primaryBtn: {
    backgroundColor: "#fff",
  },
  primaryBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: RELATIVE_COLORS.deepTeal,
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  primaryIcon: {
    width: 13,
    height: 13,
    tintColor: RELATIVE_COLORS.deepTeal,
  },
  secondaryIcon: {
    width: 13,
    height: 13,
    tintColor: "#fff",
  },
});
