import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import {
  RELATIVE_COLORS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface RelativeReviewCardProps {
  caregiverName: string;
  rating: number;
  onLeaveReview?: () => void;
  onRebook?: () => void;
}

export const RelativeReviewCard: React.FC<RelativeReviewCardProps> = ({
  caregiverName,
  rating,
  onLeaveReview,
  onRebook,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Review & Rebook</Text>
      <Text style={styles.subtitle}>Recent caregiver: {caregiverName}</Text>

      <View style={styles.ratingRow}>
        <Text style={styles.ratingText}>Rating {rating.toFixed(1)} / 5</Text>
        <Text style={styles.stars}>★★★★★</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onLeaveReview}>
          <Text style={styles.primaryText}>Leave Review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onRebook}>
          <Text style={styles.secondaryText}>Quick Rebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: 12,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 14,
    ...RELATIVE_SHADOW,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 3,
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  ratingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  ratingText: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  stars: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  primaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
