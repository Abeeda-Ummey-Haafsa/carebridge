import React, { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

import { RelativeBooking } from "@/types/relative-dashboard";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface UpcomingBookingCardProps {
  booking: RelativeBooking;
  index: number;
  onViewDetails: (booking: RelativeBooking) => void;
  onReschedule: (booking: RelativeBooking) => void;
  onCancelBooking: (booking: RelativeBooking) => void;
}

function UpcomingBookingCard({
  booking,
  index,
  onViewDetails,
  onReschedule,
  onCancelBooking,
}: UpcomingBookingCardProps) {
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 90).duration(420)}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={icons.profile1} style={styles.avatar} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{booking.elderName}</Text>
          <Text style={styles.careType}>{booking.careType}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.timelineRow}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLine} />
        <View style={styles.timelineCopy}>
          <Text style={styles.metaText}>
            {booking.dateLabel} at {booking.timeLabel}
          </Text>
          <Text style={styles.metaSubText}>
            {booking.duration} • {booking.countdown}
          </Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Caregiver</Text>
          <Text style={styles.detailValue}>{booking.caregiverName}</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Rating</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={RELATIVE_COLORS.warning} />
            <Text style={styles.detailValue}>{booking.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewDetails(booking)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onReschedule(booking)}
        >
          <Text style={styles.actionButtonText}>Reschedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => onCancelBooking(booking)}
        >
          <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default memo(UpcomingBookingCard);

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 16,
    marginRight: 12,
    ...RELATIVE_SHADOW,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 28,
    height: 28,
    tintColor: RELATIVE_COLORS.deepTeal,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  careType: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "800",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: RELATIVE_COLORS.border,
    marginTop: 10,
    borderRadius: 999,
  },
  timelineCopy: {
    flex: 1,
  },
  metaText: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  metaSubText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  detailCard: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
  },
  detailLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  detailValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: "center",
  },
  actionButtonText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "800",
  },
  cancelButton: {
    backgroundColor: RELATIVE_COLORS.dangerSoft,
  },
  cancelButtonText: {
    color: RELATIVE_COLORS.danger,
  },
});
