import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";
import { FindCareBookingPreview, FindCareCaregiver } from "@/types/find-care";

interface BookingPreviewCardProps {
  caregiver: FindCareCaregiver | null;
  preview: FindCareBookingPreview | null;
  onBookNow: () => void;
}

function BookingPreviewCard({
  caregiver,
  preview,
  onBookNow,
}: BookingPreviewCardProps) {
  if (!caregiver || !preview) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.duration(360)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{caregiver.avatarLabel}</Text>
        </View>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>Quick booking preview</Text>
          <Text style={styles.subtitle}>
            {caregiver.name} · {preview.careType}
          </Text>
        </View>
        <View style={styles.priceBubble}>
          <Text style={styles.priceValue}>${preview.estimatedCost}</Text>
          <Text style={styles.priceLabel}>est.</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Ionicons
            name="time-outline"
            size={14}
            color={RELATIVE_COLORS.tealDark}
          />
          <Text style={styles.summaryText}>{preview.estimatedArrival}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons
            name="hourglass-outline"
            size={14}
            color={RELATIVE_COLORS.tealDark}
          />
          <Text style={styles.summaryText}>
            {preview.durationHours} hr duration
          </Text>
        </View>
      </View>

      <Pressable style={styles.cta} onPress={onBookNow}>
        <Text style={styles.ctaText}>Continue to booking</Text>
        <Ionicons name="arrow-forward" size={16} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

export default memo(BookingPreviewCard);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    ...RELATIVE_SHADOW,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  avatarText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 14,
    fontWeight: "800",
  },
  copyBlock: {
    flex: 1,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  priceBubble: {
    alignItems: "flex-end",
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceValue: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 17,
    fontWeight: "900",
  },
  priceLabel: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 10,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  summaryText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "700",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
