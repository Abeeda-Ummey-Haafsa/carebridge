import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Animated, { Layout } from "react-native-reanimated";

import { icons } from "@/constants";
import { ElderProfile } from "@/store/relativeProfileStore";
import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface RelativeElderCardProps {
  elder: ElderProfile;
  selected: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onViewProfile?: () => void;
  onEditInfo?: () => void;
  onEmergencyContacts?: () => void;
}

export const RelativeElderCard: React.FC<RelativeElderCardProps> = ({
  elder,
  selected,
  onSelect,
  onToggleExpand,
  onViewProfile,
  onEditInfo,
  onEmergencyContacts,
}) => {
  const statusColor =
    elder.careStatus === "Active"
      ? RELATIVE_COLORS.teal
      : elder.careStatus === "Needs Attention"
        ? RELATIVE_COLORS.danger
        : RELATIVE_COLORS.success;

  return (
    <Animated.View layout={Layout.springify()}>
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.9}
        onPress={onSelect}
      >
        <View style={styles.topRow}>
          <Image source={icons.profile1} style={styles.avatar} />
          <View style={styles.identity}>
            <Text style={styles.name}>{elder.name}</Text>
            <Text style={styles.meta}>Mobility: {elder.mobilityLevel}</Text>
            <View style={styles.badgesRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: `${statusColor}1f` },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {elder.careStatus}
                </Text>
              </View>
              {!!elder.emergencyFlag && (
                <View style={styles.emergencyChip}>
                  <Text style={styles.emergencyText}>Emergency</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.chevronBtn} onPress={onToggleExpand}>
            <Image
              source={icons.arrowDown}
              style={[styles.chevron, elder.expanded && styles.chevronOpen]}
            />
          </TouchableOpacity>
        </View>

        {elder.expanded && (
          <View style={styles.expandArea}>
            <View style={styles.gridRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Preferred Language</Text>
                <Text style={styles.infoValue}>{elder.preferredLanguage}</Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoLabel}>Active Caregiver</Text>
                <Text style={styles.infoValue}>{elder.activeCaregiver}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onViewProfile}
              >
                <Text style={styles.primaryText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onEditInfo}
              >
                <Text style={styles.secondaryText}>Edit Info</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onEmergencyContacts}
              >
                <Text style={styles.secondaryText}>Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    padding: 12,
    ...RELATIVE_SHADOW,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: RELATIVE_COLORS.teal,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  identity: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    color: RELATIVE_COLORS.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: RELATIVE_COLORS.muted,
  },
  badgesRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  emergencyChip: {
    backgroundColor: RELATIVE_COLORS.dangerSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  emergencyText: {
    color: RELATIVE_COLORS.danger,
    fontSize: 10,
    fontWeight: "800",
  },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    width: 14,
    height: 14,
    tintColor: RELATIVE_COLORS.muted,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  expandArea: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: RELATIVE_COLORS.border,
    paddingTop: 10,
    gap: 8,
  },
  gridRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoCell: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  infoValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  primaryBtn: {
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  primaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBtn: {
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  secondaryText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
