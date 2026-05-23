import { memo, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { ELDER_COLORS, ELDER_RADIUS, ELDER_SHADOW } from "../theme";

interface SOSButtonProps {
  reduceMotion: boolean;
  active: boolean;
  onPress: () => void;
}

function SOSButton({ reduceMotion, active, onPress }: SOSButtonProps) {
  const pulse = useSharedValue(1);
  const press = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, [pulse, reduceMotion]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.value }],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, pulseStyle]} />
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withTiming(0.98, { duration: 90 });
        }}
        onPressOut={() => {
          press.value = withTiming(1, { duration: 120 });
        }}
        accessibilityRole="button"
        accessibilityLabel={
          active ? "Emergency help sent" : "Send emergency SOS"
        }
        accessibilityHint="Double tap to open the emergency confirmation screen"
        style={({ pressed }) => [
          styles.button,
          active && styles.buttonActive,
          pressed && styles.buttonPressed,
        ]}
      >
        <Animated.View style={[styles.inner, pressStyle]}>
          <Ionicons
            name="alert-circle"
            size={42}
            color={ELDER_COLORS.surface}
          />
          <Text style={styles.label}>SOS</Text>
          <Text style={styles.subLabel}>
            {active ? "Help sent" : "Emergency help"}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default memo(SOSButton);

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    minHeight: 210,
  },
  ring: {
    position: "absolute",
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: "rgba(214, 71, 63, 0.12)",
  },
  button: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: ELDER_COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.75)",
    ...ELDER_SHADOW,
  },
  buttonActive: {
    backgroundColor: ELDER_COLORS.dangerDark,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    color: ELDER_COLORS.surface,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  subLabel: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
