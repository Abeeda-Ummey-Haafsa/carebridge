import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { EmergencyContact } from "@/store/relativeProfileStore";
import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface RelativeEmergencyContactCardProps {
  contact: EmergencyContact;
  onPress?: () => void;
}

export const RelativeEmergencyContactCard: React.FC<
  RelativeEmergencyContactCardProps
> = ({ contact, onPress }) => {
  const isPrimary = contact.priority === "Primary";

  return (
    <TouchableOpacity
      style={[styles.card, isPrimary && styles.cardPrimary]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.headRow}>
        <Text style={styles.name}>{contact.name}</Text>
        <View
          style={[styles.priorityChip, isPrimary && styles.priorityChipPrimary]}
        >
          <Text
            style={[
              styles.priorityText,
              isPrimary && styles.priorityTextPrimary,
            ]}
          >
            {contact.priority}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>{contact.relationship}</Text>
      <Text style={styles.phone}>{contact.phone}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 12,
    marginBottom: 8,
    ...RELATIVE_SHADOW,
  },
  cardPrimary: {
    borderColor: "#fecaca",
    backgroundColor: "#fff9fa",
  },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  priorityChip: {
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityChipPrimary: {
    backgroundColor: RELATIVE_COLORS.dangerSoft,
  },
  priorityText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 10,
    fontWeight: "800",
  },
  priorityTextPrimary: {
    color: RELATIVE_COLORS.danger,
  },
  meta: {
    marginTop: 5,
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
  },
  phone: {
    marginTop: 3,
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
