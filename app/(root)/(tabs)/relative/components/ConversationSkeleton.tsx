/**
 * ConversationSkeleton Component
 * Loading placeholder for conversation cards
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { useEffect } from "react";

interface ConversationSkeletonProps {
  count?: number;
  style?: ViewStyle;
}

const SkeletonLine = ({ width = "100%" }: { width?: string | number }) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 1],
      [0.3, 0.7],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height: 12,
          borderRadius: 6,
          backgroundColor: "#e6e6e6",
        },
        animatedStyle,
      ]}
    />
  );
};

export const ConversationSkeleton = ({
  count = 3,
  style,
}: ConversationSkeletonProps) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.avatar} />
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <SkeletonLine width="60%" />
              <SkeletonLine width="30%" />
            </View>
            <View style={styles.infoRow}>
              <SkeletonLine width="40%" />
            </View>
            <View style={styles.footerRow}>
              <SkeletonLine width="70%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e6e6e6",
    marginRight: 15,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  infoRow: {
    marginTop: 4,
  },
  footerRow: {
    marginTop: 4,
  },
});
