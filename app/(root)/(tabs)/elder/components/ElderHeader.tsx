import { memo, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants";

import {
  ELDER_COLORS,
  ELDER_GRADIENTS,
  ELDER_RADIUS,
  ELDER_SHADOW,
} from "../theme";

interface ElderHeaderProps {
  name: string;
  timeLabel: string;
  statusLabel: string;
  reduceMotion: boolean;
  onLogout: () => void;
}

function ElderHeader({
  name,
  timeLabel,
  statusLabel,
  reduceMotion,
  onLogout,
}: ElderHeaderProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1300 }),
        withTiming(1, { duration: 1300 }),
      ),
      -1,
      false,
    );
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.025], [0.96, 1]),
  }));

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(400)}
      style={styles.shell}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${name}. ${timeLabel}. ${statusLabel}.`}
    >
      <LinearGradient colors={ELDER_GRADIENTS.header} style={styles.gradient}>
        <View style={styles.topRow}>
          <View style={styles.topSpacer} />
          <Pressable
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Signs out of the elder dashboard"
            hitSlop={12}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Image source={icons.out} style={styles.logoutIcon} />
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.kicker}>Emergency care</Text>
            <Text style={styles.greeting}>Good morning, {name}</Text>
            <Text style={styles.timeLabel}>{timeLabel}</Text>
          </View>

          <Animated.View style={[styles.statusPill, pulseStyle]}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={ELDER_COLORS.primaryDark}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

export default memo(ElderHeader);

const styles = StyleSheet.create({
  shell: {
    borderRadius: ELDER_RADIUS.xl,
    overflow: "hidden",
    marginBottom: 16,
    ...ELDER_SHADOW,
  },
  gradient: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: ELDER_RADIUS.xl,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  topSpacer: {
    flex: 1,
  },
  logoutButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELDER_COLORS.surface,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
  },
  logoutButtonPressed: {
    opacity: 0.9,
  },
  logoutIcon: {
    width: 18,
    height: 18,
    tintColor: ELDER_COLORS.danger,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  copy: {
    flex: 1,
    paddingRight: 6,
  },
  kicker: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  greeting: {
    color: ELDER_COLORS.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  timeLabel: {
    color: ELDER_COLORS.textSoft,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 8,
  },
  statusPill: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: ELDER_RADIUS.pill,
    backgroundColor: ELDER_COLORS.surface,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 128,
  },
});
