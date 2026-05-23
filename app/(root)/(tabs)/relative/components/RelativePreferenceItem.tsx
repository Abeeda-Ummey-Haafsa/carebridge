import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";

import { RELATIVE_COLORS } from "../theme";

interface RelativePreferenceItemProps {
  label: string;
  value?: boolean;
  trailingText?: string;
  description?: string;
  onToggle?: () => void;
  onPress?: () => void;
}

export const RelativePreferenceItem: React.FC<RelativePreferenceItemProps> = ({
  label,
  value,
  trailingText,
  description,
  onToggle,
  onPress,
}) => {
  const isSwitch = typeof value === "boolean";

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.copyWrap}>
        <Text style={styles.label}>{label}</Text>
        {!!description && <Text style={styles.description}>{description}</Text>}
      </View>

      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#d8e9e6", true: "#9adacc" }}
          thumbColor={value ? RELATIVE_COLORS.teal : "#f9f9f9"}
        />
      ) : (
        <Text style={styles.trailingText}>{trailingText}</Text>
      )}
    </TouchableOpacity>
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
  trailingText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
