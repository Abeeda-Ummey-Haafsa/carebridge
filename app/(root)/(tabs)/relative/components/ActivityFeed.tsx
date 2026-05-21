import React, { memo } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

import { RelativeActivityUpdate } from "@/types/relative-dashboard";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface ActivityFeedProps {
  updates: RelativeActivityUpdate[];
}

function ActivityFeed({ updates }: ActivityFeedProps) {
  if (!updates.length) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={styles.emptyCard}
      >
        <Text style={styles.emptyTitle}>No recent caregiver updates</Text>
        <Text style={styles.emptyText}>
          Activity will show here as caregivers log visits and health checks.
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(260).duration(420)}
      style={styles.card}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.kicker}>Live feed</Text>
          <Text style={styles.title}>Recent Caregiver Updates</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Realtime</Text>
        </View>
      </View>

      <FlatList
        data={updates}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).duration(260)}
            style={styles.feedRow}
          >
            <View style={styles.feedRail}>
              <View style={styles.feedAvatar}>
                <Image source={icons.man} style={styles.feedAvatarIcon} />
              </View>
              <View style={styles.feedLine} />
            </View>

            <View style={styles.feedContent}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedName}>{item.caregiverName}</Text>
                <Text style={styles.feedTime}>{item.timestamp}</Text>
              </View>
              <Text style={styles.feedMessage}>{item.message}</Text>
              <View style={styles.feedMeta}>
                <Ionicons
                  name="document-text-outline"
                  size={13}
                  color={RELATIVE_COLORS.teal}
                />
                <Text style={styles.feedReference}>{item.reference}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      />
    </Animated.View>
  );
}

export default memo(ActivityFeed);

const styles = StyleSheet.create({
  card: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 18,
    marginBottom: 18,
    ...RELATIVE_SHADOW,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  kicker: {
    color: RELATIVE_COLORS.teal,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  liveText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "800",
  },
  feedRow: {
    flexDirection: "row",
    gap: 12,
  },
  feedRail: {
    alignItems: "center",
    width: 42,
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  feedAvatarIcon: {
    width: 22,
    height: 22,
    tintColor: RELATIVE_COLORS.deepTeal,
  },
  feedLine: {
    width: 2,
    flex: 1,
    marginTop: 6,
    backgroundColor: RELATIVE_COLORS.border,
    borderRadius: 999,
  },
  feedContent: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
  },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  feedName: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  feedTime: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
  },
  feedMessage: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  feedMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  feedReference: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "700",
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 18,
    marginBottom: 18,
    ...RELATIVE_SHADOW,
  },
  emptyTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
