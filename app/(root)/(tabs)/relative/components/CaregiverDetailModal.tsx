import React, { memo, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";
import { FindCareCaregiver } from "@/types/find-care";

interface CaregiverDetailModalProps {
  caregiver: FindCareCaregiver | null;
  visible: boolean;
  onClose: () => void;
  onBookNow: () => void;
}

function ExpandableSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={styles.sectionCard}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => setIsOpen((value) => !value)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={RELATIVE_COLORS.deepTeal}
        />
      </Pressable>
      {isOpen ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function CaregiverDetailModal({
  caregiver,
  visible,
  onClose,
  onBookNow,
}: CaregiverDetailModalProps) {
  const ratingBreakdown = useMemo(() => {
    if (!caregiver) {
      return [];
    }

    return [
      { label: "Professionalism", value: "4.9" },
      { label: "Communication", value: "4.8" },
      { label: "Punctuality", value: "4.9" },
    ];
  }, [caregiver]);

  if (!caregiver) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <Animated.View entering={FadeInUp.duration(320)} style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.heroRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{caregiver.avatarLabel}</Text>
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.name}>{caregiver.name}</Text>
                <Text style={styles.subCopy}>{caregiver.bio}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={styles.statValue}>{caregiver.rating}</Text>
                <Text style={styles.statHint}>
                  {caregiver.reviewCount} reviews
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Sessions</Text>
                <Text style={styles.statValue}>
                  {caregiver.completedSessions}
                </Text>
                <Text style={styles.statHint}>completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Radius</Text>
                <Text style={styles.statValue}>
                  {caregiver.serviceRadiusMiles} mi
                </Text>
                <Text style={styles.statHint}>service area</Text>
              </View>
            </View>

            <ExpandableSection title="About">
              <Text style={styles.paragraph}>{caregiver.bio}</Text>
              <View style={styles.inlineMetaRow}>
                {caregiver.certifications.map((cert) => (
                  <View key={cert} style={styles.inlinePill}>
                    <Text style={styles.inlinePillText}>{cert}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="Experience">
              <View style={styles.bulletGrid}>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={RELATIVE_COLORS.tealDark}
                  />
                  <Text style={styles.bulletText}>
                    {caregiver.experienceYears} years of experience
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="language-outline"
                    size={16}
                    color={RELATIVE_COLORS.tealDark}
                  />
                  <Text style={styles.bulletText}>
                    {caregiver.languages.join(", ")}
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={RELATIVE_COLORS.tealDark}
                  />
                  <Text style={styles.bulletText}>
                    {caregiver.availabilityWindow}
                  </Text>
                </View>
              </View>
            </ExpandableSection>

            <ExpandableSection title="Reviews">
              <View style={styles.breakdownRow}>
                {ratingBreakdown.map((item) => (
                  <View key={item.label} style={styles.breakdownCard}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownValue}>{item.value}</Text>
                  </View>
                ))}
              </View>

              {caregiver.reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons
                        name="star"
                        size={14}
                        color={RELATIVE_COLORS.warning}
                      />
                      <Text style={styles.reviewRating}>{review.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  <Text style={styles.reviewTime}>{review.timestamp}</Text>
                </View>
              ))}
            </ExpandableSection>

            <ExpandableSection title="Services">
              <View style={styles.inlineMetaRow}>
                {caregiver.careTypes.map((careType) => (
                  <View key={careType} style={styles.inlinePill}>
                    <Text style={styles.inlinePillText}>{careType}</Text>
                  </View>
                ))}
              </View>
            </ExpandableSection>

            <ExpandableSection title="Pricing">
              <View style={styles.priceGrid}>
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Hourly rate</Text>
                  <Text style={styles.priceValue}>
                    ${caregiver.hourlyRate}/hr
                  </Text>
                </View>
                <View style={styles.priceCard}>
                  <Text style={styles.priceLabel}>Estimated arrival</Text>
                  <Text style={styles.priceValue}>
                    {caregiver.etaMinutes} min
                  </Text>
                </View>
              </View>
            </ExpandableSection>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onBookNow}>
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(CaregiverDetailModal);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8,18,24,0.28)",
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: "88%",
    backgroundColor: RELATIVE_COLORS.screen,
    borderTopLeftRadius: RELATIVE_RADIUS.xl,
    borderTopRightRadius: RELATIVE_RADIUS.xl,
    paddingTop: 10,
    ...RELATIVE_SHADOW,
  },
  handle: {
    alignSelf: "center",
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.border,
    marginBottom: 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 14,
  },
  heroRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: RELATIVE_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...RELATIVE_SHADOW,
  },
  avatarText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 18,
    fontWeight: "900",
  },
  heroCopy: {
    flex: 1,
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subCopy: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
    ...RELATIVE_SHADOW,
  },
  statLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  statValue: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  statHint: {
    color: RELATIVE_COLORS.soft,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    overflow: "hidden",
    ...RELATIVE_SHADOW,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sectionTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  paragraph: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  inlineMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inlinePill: {
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlinePillText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "700",
  },
  bulletGrid: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletText: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  breakdownLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  breakdownValue: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  reviewCard: {
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewAuthor: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewRating: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  reviewComment: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  reviewTime: {
    color: RELATIVE_COLORS.soft,
    fontSize: 11,
    fontWeight: "700",
  },
  priceGrid: {
    flexDirection: "row",
    gap: 10,
  },
  priceCard: {
    flex: 1,
    padding: 12,
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  priceLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  priceValue: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 16,
    backgroundColor: RELATIVE_COLORS.screen,
  },
  secondaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
  },
  secondaryButtonText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 14,
    fontWeight: "800",
  },
  primaryButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
