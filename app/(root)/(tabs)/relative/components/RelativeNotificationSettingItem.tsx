import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

import { RELATIVE_COLORS } from "../theme";

interface RelativeNotificationSettingItemProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}

export const RelativeNotificationSettingItem: React.FC<
  RelativeNotificationSettingItemProps
> = ({ label, description, value, onToggle }) => {
  return (
    <View style={styles.row}>
      <View style={styles.copyWrap}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#d8e9e6", true: "#9adacc" }}
        thumbColor={value ? RELATIVE_COLORS.teal : "#f9f9f9"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  copyWrap: {
    flex: 1,
    paddingRight: 10,
  },
  label: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  description: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
