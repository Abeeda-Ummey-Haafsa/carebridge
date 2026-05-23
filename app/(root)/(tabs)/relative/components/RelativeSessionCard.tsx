import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { icons } from "@/constants";
import { RelativeCareSession } from "@/store/relativeSessionsStore";
import {
  RELATIVE_COLORS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface RelativeSessionCardProps {
  session: RelativeCareSession;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenDetails: () => void;
  onOpenChat: () => void;
  onRebook: () => void;
  onLeaveReview: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

const getStatusStyle = (status: RelativeCareSession["status"]) => {
  if (status === "Upcoming") {
    return { bg: "#e0f2fe", color: "#0284c7" };
  }

  if (status === "Active") {
    return { bg: "#e6f8f5", color: RELATIVE_COLORS.teal };
  }

  if (status === "Cancelled") {
    return { bg: RELATIVE_COLORS.dangerSoft, color: RELATIVE_COLORS.danger };
  }

  return { bg: "#e8faf3", color: RELATIVE_COLORS.success };
};

const RelativeSessionCardBase: React.FC<RelativeSessionCardProps> = ({
  session,
  isExpanded,
  onToggleExpand,
  onOpenDetails,
  onOpenChat,
  onRebook,
  onLeaveReview,
}) => {
  const statusStyle = getStatusStyle(session.status);

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      layout={Layout.springify()}
    >
      <View style={styles.rowContainer}>
        <View style={styles.timelineRail}>
          <View
            style={[styles.timelineDot, { backgroundColor: statusStyle.color }]}
          />
          <View style={styles.timelineLine} />
        </View>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.92}
          onPress={onToggleExpand}
          accessibilityRole="button"
          accessibilityLabel={`Session with ${session.caregiverName}`}
        >
          <View style={styles.headerRow}>
            <View style={styles.leftWrap}>
              <Image
                source={{ uri: session.caregiverAvatarUrl }}
                style={styles.avatar}
              />
              <View style={styles.titleWrap}>
                <Text style={styles.caregiverName}>
                  {session.caregiverName}
                </Text>
                <Text style={styles.elderText}>For {session.elderName}</Text>
              </View>
            </View>

            <View style={styles.rightWrap}>
              <View
                style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}
              >
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {session.status}
                </Text>
              </View>
              <Text style={styles.amountText}>
                {formatCurrency(session.cost)}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Image source={icons.history} style={styles.metaIcon} />
              <Text style={styles.metaText}>{session.date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Image source={icons.session} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                {session.startTime} - {session.endTime}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Image source={icons.to} style={styles.metaIcon} />
              <Text style={styles.metaText}>{session.duration}</Text>
            </View>
          </View>

          {isExpanded && (
            <Animated.View
              layout={Layout.springify()}
              style={styles.expandedWrap}
            >
              <View style={styles.infoGrid}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Care Type</Text>
                  <Text style={styles.infoValue}>{session.careType}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {session.location}
                  </Text>
                </View>
              </View>

              <View style={styles.notesBox}>
                <Text style={styles.infoLabel}>Caregiver Notes</Text>
                <Text style={styles.notesText}>{session.notes}</Text>
              </View>

              {!!session.sessionUpdates?.length && (
                <View style={styles.updatesBlock}>
                  <Text style={styles.infoLabel}>Updates</Text>
                  {session.sessionUpdates.slice(0, 2).map((update) => (
                    <View key={update.id} style={styles.updateRow}>
                      <View style={styles.updateDot} />
                      <Text style={styles.updateText}>
                        {update.timestamp} - {update.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={onOpenDetails}
                >
                  <Text style={styles.primaryBtnText}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={onOpenChat}
                >
                  <Text style={styles.secondaryBtnText}>Open Chat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={onRebook}
                >
                  <Text style={styles.secondaryBtnText}>Rebook</Text>
                </TouchableOpacity>
                {session.status === "Completed" && (
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={onLeaveReview}
                  >
                    <Text style={styles.secondaryBtnText}>Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const RelativeSessionCard = memo(RelativeSessionCardBase);

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginBottom: 12,
  },
  timelineRail: {
    width: 22,
    alignItems: "center",
    marginTop: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  timelineLine: {
    marginTop: 5,
    width: 2,
    flex: 1,
    backgroundColor: RELATIVE_COLORS.border,
  },
  card: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
    ...RELATIVE_SHADOW,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  titleWrap: {
    marginLeft: 10,
    flex: 1,
  },
  caregiverName: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  elderText: {
    marginTop: 1,
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  rightWrap: {
    alignItems: "flex-end",
  },
  statusChip: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },
  amountText: {
    marginTop: 5,
    color: RELATIVE_COLORS.teal,
    fontSize: 15,
    fontWeight: "800",
  },
  metaRow: {
    marginTop: 11,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    width: 13,
    height: 13,
    tintColor: RELATIVE_COLORS.teal,
  },
  metaText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  expandedWrap: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: RELATIVE_COLORS.border,
    gap: 9,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 8,
  },
  infoCell: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  infoValue: {
    marginTop: 2,
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  notesBox: {
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: RELATIVE_COLORS.teal,
  },
  notesText: {
    marginTop: 3,
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  updatesBlock: {
    gap: 5,
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  updateDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  updateText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  actionsRow: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  primaryBtn: {
    backgroundColor: RELATIVE_COLORS.teal,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  secondaryBtnText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
