import React, { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

function SkeletonBlock({
  width,
  height,
}: {
  width: string | number;
  height: number;
}) {
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View style={[styles.block, animatedStyle, { width, height }]} />
  );
}

function FindCareSkeleton() {
  return (
    <View style={styles.shell}>
      <SkeletonBlock width="100%" height={104} />
      <SkeletonBlock width="100%" height={56} />
      <View style={styles.mapShell}>
        <SkeletonBlock width="100%" height={280} />
        <View style={styles.mapPins}>
          <SkeletonBlock width={72} height={36} />
          <SkeletonBlock width={72} height={36} />
          <SkeletonBlock width={72} height={36} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={180} />
      <SkeletonBlock width="100%" height={180} />
    </View>
  );
}

export default memo(FindCareSkeleton);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    gap: 12,
    padding: 20,
  },
  block: {
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    ...RELATIVE_SHADOW,
  },
  mapShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: RELATIVE_RADIUS.xl,
  },
  mapPins: {
    position: "absolute",
    top: 16,
    right: 16,
    bottom: 16,
    left: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
