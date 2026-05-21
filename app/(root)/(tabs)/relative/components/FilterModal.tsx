import React, { memo } from "react";
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
import { FindCareFilters } from "@/types/find-care";

interface FilterModalProps {
  visible: boolean;
  filters: FindCareFilters;
  careTypes: string[];
  languages: string[];
  onClose: () => void;
  onApply: (filters: Partial<FindCareFilters>) => void;
  onReset: () => void;
}

const sortOptions = [
  { id: "nearest", label: "Nearest" },
  { id: "highest-rated", label: "Highest rated" },
  { id: "lowest-price", label: "Lowest price" },
  { id: "fastest-arrival", label: "Fastest arrival" },
];

function FilterModal({
  visible,
  filters,
  careTypes,
  languages,
  onClose,
  onApply,
  onReset,
}: FilterModalProps) {
  const toggleValue = (key: keyof FindCareFilters, value: string) => {
    if (key === "availability") {
      const next = filters.availability.includes(value as never)
        ? filters.availability.filter((item) => item !== value)
        : [...filters.availability, value as never];
      onApply({ availability: next as FindCareFilters["availability"] });
      return;
    }

    if (key === "careTypes") {
      const next = filters.careTypes.includes(value)
        ? filters.careTypes.filter((item) => item !== value)
        : [...filters.careTypes, value];
      onApply({ careTypes: next });
      return;
    }

    if (key === "languages") {
      const next = filters.languages.includes(value)
        ? filters.languages.filter((item) => item !== value)
        : [...filters.languages, value];
      onApply({ languages: next });
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <Animated.View entering={FadeInUp.duration(280)} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>Filters and sort</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close"
                size={18}
                color={RELATIVE_COLORS.deepTeal}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <View style={styles.chipGrid}>
                {sortOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() =>
                      onApply({
                        sortBy: option.id as FindCareFilters["sortBy"],
                      })
                    }
                    style={[
                      styles.chip,
                      filters.sortBy === option.id && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.sortBy === option.id && styles.chipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hourly rate range</Text>
              <View style={styles.sliderCard}>
                <Text style={styles.sliderValue}>
                  ${filters.rateRange[0]} - ${filters.rateRange[1]} / hr
                </Text>
                <View style={styles.track}>
                  <View style={styles.trackFill} />
                  <View style={[styles.thumb, styles.thumbLeft]} />
                  <View style={[styles.thumb, styles.thumbRight]} />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Budget friendly</Text>
                  <Text style={styles.sliderLabel}>Premium care</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              <View style={styles.chipGrid}>
                {(["available-now", "scheduled", "offline"] as const).map(
                  (value) => (
                    <Pressable
                      key={value}
                      onPress={() => toggleValue("availability", value)}
                      style={[
                        styles.chip,
                        filters.availability.includes(value) &&
                          styles.chipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.availability.includes(value) &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {value === "available-now"
                          ? "Available now"
                          : value === "scheduled"
                            ? "Scheduled"
                            : "Offline"}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Care types</Text>
              <View style={styles.chipGrid}>
                {careTypes.map((careType) => (
                  <Pressable
                    key={careType}
                    onPress={() => toggleValue("careTypes", careType)}
                    style={[
                      styles.chip,
                      filters.careTypes.includes(careType) &&
                        styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.careTypes.includes(careType) &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {careType}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.chipGrid}>
                {languages.map((language) => (
                  <Pressable
                    key={language}
                    onPress={() => toggleValue("languages", language)}
                    style={[
                      styles.chip,
                      filters.languages.includes(language) &&
                        styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.languages.includes(language) &&
                          styles.chipTextSelected,
                      ]}
                    >
                      {language}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience and radius</Text>
              <View style={styles.pillRow}>
                <View style={styles.infoPill}>
                  <Text style={styles.infoLabel}>Min years</Text>
                  <Text style={styles.infoValue}>
                    {filters.yearsExperience}+
                  </Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoLabel}>Radius</Text>
                  <Text style={styles.infoValue}>
                    {filters.distanceRadius} mi
                  </Text>
                </View>
                <View style={styles.infoPill}>
                  <Text style={styles.infoLabel}>Rating</Text>
                  <Text style={styles.infoValue}>{filters.minRating}+</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.ghostButton} onPress={onReset}>
              <Text style={styles.ghostButtonText}>Reset</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Apply filters</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default memo(FilterModal);

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
    maxHeight: "90%",
    backgroundColor: RELATIVE_COLORS.screen,
    borderTopLeftRadius: RELATIVE_RADIUS.xl,
    borderTopRightRadius: RELATIVE_RADIUS.xl,
    ...RELATIVE_SHADOW,
  },
  handle: {
    alignSelf: "center",
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.border,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surface,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  chipSelected: {
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  chipText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextSelected: {
    color: RELATIVE_COLORS.tealDark,
  },
  sliderCard: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 14,
    ...RELATIVE_SHADOW,
  },
  sliderValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    justifyContent: "center",
  },
  trackFill: {
    position: "absolute",
    left: 12,
    right: 36,
    height: 10,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 3,
    borderColor: RELATIVE_COLORS.teal,
    top: -7,
    ...RELATIVE_SHADOW,
  },
  thumbLeft: {
    left: 18,
  },
  thumbRight: {
    right: 18,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sliderLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  infoPill: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.md,
    padding: 12,
  },
  infoLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  infoValue: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  ghostButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: RELATIVE_COLORS.surface,
  },
  ghostButtonText: {
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
