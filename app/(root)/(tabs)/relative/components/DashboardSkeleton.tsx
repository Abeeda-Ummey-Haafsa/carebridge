import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";

import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "../theme";

const SkeletonBlock = ({
  width,
  height,
  radius = RELATIVE_RADIUS.md,
  marginBottom = 0,
}: {
  width: number | string;
  height: number;
  radius?: number;
  marginBottom?: number;
}) => {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={[
        styles.block,
        { width, height, borderRadius: radius, marginBottom },
        animatedStyle,
      ]}
    />
  );
};

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock
        width="100%"
        height={180}
        radius={RELATIVE_RADIUS.xl}
        marginBottom={18}
      />
      <SkeletonBlock
        width="100%"
        height={214}
        radius={RELATIVE_RADIUS.lg}
        marginBottom={18}
      />
      <SkeletonBlock
        width="100%"
        height={156}
        radius={RELATIVE_RADIUS.lg}
        marginBottom={18}
      />
      <SkeletonBlock
        width="100%"
        height={132}
        radius={RELATIVE_RADIUS.lg}
        marginBottom={18}
      />
      <SkeletonBlock
        width="100%"
        height={180}
        radius={RELATIVE_RADIUS.lg}
        marginBottom={18}
      />
      <SkeletonBlock
        width="100%"
        height={190}
        radius={RELATIVE_RADIUS.lg}
        marginBottom={18}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 12,
  },
  block: {
    backgroundColor: RELATIVE_COLORS.border,
  },
});
