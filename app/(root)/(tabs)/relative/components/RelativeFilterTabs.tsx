import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

import { SessionStatus } from "@/store/relativeSessionsStore";
import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "../theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterOption = "All" | SessionStatus;

interface RelativeFilterTabsProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  counts: {
    all: number;
    active: number;
    upcoming: number;
    completed: number;
    cancelled: number;
  };
}

const FILTER_OPTIONS: {
  key: FilterOption;
  label: string;
  countKey: keyof RelativeFilterTabsProps["counts"];
}[] = [
  { key: "All", label: "All", countKey: "all" },
  { key: "Upcoming", label: "Upcoming", countKey: "upcoming" },
  { key: "Active", label: "Active", countKey: "active" },
  { key: "Completed", label: "Completed", countKey: "completed" },
  { key: "Cancelled", label: "Cancelled", countKey: "cancelled" },
];

export const RelativeFilterTabs: React.FC<RelativeFilterTabsProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const handleChange = (filter: FilterOption) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onFilterChange(filter);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.key === activeFilter;
          const count = counts[option.countKey];

          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleChange(option.key)}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${option.label}`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {option.label}
              </Text>
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <Text
                  style={[styles.badgeText, isActive && styles.badgeTextActive]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: RELATIVE_COLORS.screen,
    borderBottomWidth: 1,
    borderBottomColor: RELATIVE_COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabActive: {
    backgroundColor: RELATIVE_COLORS.teal,
    borderColor: RELATIVE_COLORS.teal,
  },
  tabText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#fff",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: RELATIVE_RADIUS.sm,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  badgeText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 10,
    fontWeight: "800",
  },
  badgeTextActive: {
    color: "#fff",
  },
});
