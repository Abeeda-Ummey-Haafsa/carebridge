import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "../theme";

const usePulse = () => {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return opacity;
};

export const RelativeSessionCardSkeleton: React.FC = () => {
  const opacity = usePulse();

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHead}>
        <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
        <View style={styles.skeletonTextWrap}>
          <Animated.View style={[styles.lineLg, { opacity }]} />
          <Animated.View style={[styles.lineSm, { opacity }]} />
        </View>
      </View>
      <View style={styles.skeletonMeta}>
        <Animated.View style={[styles.lineSm, { opacity }]} />
        <Animated.View style={[styles.lineSm, { opacity }]} />
        <Animated.View style={[styles.lineXs, { opacity }]} />
      </View>
    </View>
  );
};

interface RelativeSessionsEmptyStateProps {
  filterType: string;
  onResetFilter?: () => void;
}

export const RelativeSessionsEmptyState: React.FC<
  RelativeSessionsEmptyStateProps
> = ({ filterType, onResetFilter }) => {
  const title =
    filterType === "All" ? "No Sessions Yet" : `No ${filterType} Sessions`;

  const body =
    filterType === "All"
      ? "Booked sessions and care timelines will show up here once scheduling starts."
      : "Try another filter or search term to view matching care bookings.";

  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyGlyph}>
        <View style={styles.emptyGlyphDot} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {filterType !== "All" && !!onResetFilter && (
        <TouchableOpacity style={styles.resetBtn} onPress={onResetFilter}>
          <Text style={styles.resetBtnText}>View All Sessions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const RelativeSessionsLoadingState: React.FC = () => {
  return (
    <ScrollView
      contentContainerStyle={styles.loadingContainer}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <RelativeSessionCardSkeleton key={index} />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginBottom: 12,
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    padding: 12,
  },
  skeletonHead: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  skeletonTextWrap: {
    marginLeft: 10,
    flex: 1,
    gap: 6,
  },
  lineLg: {
    height: 12,
    width: "64%",
    borderRadius: 6,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  lineSm: {
    height: 10,
    width: "42%",
    borderRadius: 6,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  lineXs: {
    height: 10,
    width: "26%",
    borderRadius: 6,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  skeletonMeta: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: RELATIVE_COLORS.border,
    paddingTop: 10,
    gap: 7,
  },
  loadingContainer: {
    paddingTop: 14,
    paddingBottom: 24,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 70,
    paddingBottom: 80,
  },
  emptyGlyph: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyGlyphDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  emptyTitle: {
    marginTop: 14,
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    marginTop: 8,
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 320,
  },
  resetBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  resetBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
