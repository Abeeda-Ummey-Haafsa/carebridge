import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";
import { FindCareCaregiver } from "@/types/find-care";

interface CaregiverCardProps {
  caregiver: FindCareCaregiver;
  index: number;
  selected: boolean;
  onPress: (caregiverId: string) => void;
  onViewProfile: (caregiverId: string) => void;
  onBookNow: (caregiverId: string) => void;
  onToggleFavorite: (caregiverId: string) => void;
}

function CaregiverCard({
  caregiver,
  index,
  selected,
  onPress,
  onViewProfile,
  onBookNow,
  onToggleFavorite,
}: CaregiverCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(360)}>
      <Pressable
        onPress={() => onPress(caregiver.id)}
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{caregiver.avatarLabel}</Text>
          </View>

          <View style={styles.headerCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{caregiver.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {caregiver.availability === "available-now"
                    ? "Available now"
                    : caregiver.availability === "scheduled"
                      ? "Scheduled"
                      : "Offline"}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="star"
                  size={13}
                  color={RELATIVE_COLORS.warning}
                />
                <Text style={styles.metaText}>{caregiver.rating}</Text>
                <Text style={styles.metaSubText}>
                  ({caregiver.reviewCount})
                </Text>
              </View>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>${caregiver.hourlyRate}/hr</Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>
                {caregiver.distanceMiles.toFixed(1)} mi
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => onToggleFavorite(caregiver.id)}
            style={styles.favoriteButton}
          >
            <Ionicons
              name="heart-outline"
              size={18}
              color={RELATIVE_COLORS.tealDark}
            />
          </Pressable>
        </View>

        <View style={styles.chipRow}>
          {caregiver.careTypes.slice(0, 3).map((careType) => (
            <View key={careType} style={styles.chip}>
              <Text style={styles.chipText}>{careType}</Text>
            </View>
          ))}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Experience</Text>
            <Text style={styles.detailValue}>
              {caregiver.experienceYears} years
            </Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>ETA</Text>
            <Text style={styles.detailValue}>{caregiver.etaMinutes} min</Text>
          </View>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Languages</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {caregiver.languages.join(", ")}
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => onViewProfile(caregiver.id)}
          >
            <Text style={styles.secondaryActionText}>View Profile</Text>
          </Pressable>
          <Pressable
            style={styles.primaryAction}
            onPress={() => onBookNow(caregiver.id)}
          >
            <Text style={styles.primaryActionText}>Book Now</Text>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(CaregiverCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    ...RELATIVE_SHADOW,
  },
  cardSelected: {
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  metaSubText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: RELATIVE_COLORS.border,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  chip: {
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  detailBlock: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 10,
  },
  detailLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  detailValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  secondaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  secondaryActionText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 13,
    fontWeight: "800",
  },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
