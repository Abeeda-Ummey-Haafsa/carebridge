import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import { icons } from "@/constants";
import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface RelativeSupportSectionProps {
  onPressItem?: (key: string) => void;
}

const supportItems = [
  { key: "help", label: "Help Center" },
  { key: "support", label: "Contact Support" },
  { key: "faq", label: "FAQ" },
  { key: "guidelines", label: "Caregiver Safety Guidelines" },
  { key: "privacy", label: "Privacy Policy" },
];

export const RelativeSupportSection: React.FC<RelativeSupportSectionProps> = ({
  onPressItem,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Support & Help</Text>

      {supportItems.map((item, index) => (
        <View key={item.key}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => onPressItem?.(item.key)}
          >
            <Text style={styles.rowText}>{item.label}</Text>
            <Image source={icons.arrowDown} style={styles.chevron} />
          </TouchableOpacity>
          {index < supportItems.length - 1 && <View style={styles.divider} />}
        </View>
      ))}

      <Text style={styles.version}>CareBridge v1.0.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 12,
    ...RELATIVE_SHADOW,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  chevron: {
    width: 14,
    height: 14,
    tintColor: RELATIVE_COLORS.muted,
    transform: [{ rotate: "-90deg" }],
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RELATIVE_COLORS.border,
  },
  version: {
    marginTop: 10,
    color: RELATIVE_COLORS.soft,
    fontSize: 11,
    textAlign: "center",
  },
});
