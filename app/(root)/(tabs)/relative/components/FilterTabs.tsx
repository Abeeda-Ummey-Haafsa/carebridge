/**
 * FilterTabs Component
 * Tab filter buttons for conversation list
 */

import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";

type FilterTab = "all" | "active" | "unread" | "archived";

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  style?: ViewStyle;
}

const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Unread", value: "unread" },
  { label: "Archived", value: "archived" },
];

export const FilterTabs = ({
  activeTab,
  onTabChange,
  style,
}: FilterTabsProps) => {
  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          style={[styles.tab, activeTab === tab.value && styles.activeTab]}
          onPress={() => onTabChange(tab.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.value && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e6e6e6",
  },
  activeTab: {
    backgroundColor: "#1fb299",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
});
