import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants";
import { RelativeProfile } from "@/store/relativeProfileStore";
import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface RelativeProfileHeaderProps {
  profile: RelativeProfile;
  quickStats: Array<{ label: string; value: string }>;
  onEditPress?: () => void;
}

export const RelativeProfileHeader: React.FC<RelativeProfileHeaderProps> = ({
  profile,
  quickStats,
  onEditPress,
}) => {
  const completionWidth: `${number}%` = `${Math.max(
    8,
    profile.profileCompletion,
  )}%`;

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={RELATIVE_GRADIENTS.header}
        style={styles.gradientTop}
      />
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Image source={icons.profile1} style={styles.avatar} />
          <View style={styles.identityWrap}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.email}>{profile.email}</Text>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {profile.verified ? "Verified" : "Unverified"}
                </Text>
              </View>
              <Text style={styles.metaText}>
                Member since {profile.memberSince}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={onEditPress}>
            <Image source={icons.edit} style={styles.editIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.completionBlock}>
          <View style={styles.completionTitleRow}>
            <Text style={styles.completionLabel}>Profile Completion</Text>
            <Text style={styles.completionPct}>
              {profile.profileCompletion}%
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: completionWidth }]} />
          </View>
        </View>

        <View style={styles.statsRow}>
          {quickStats.map((item) => (
            <View key={item.label} style={styles.statCell}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  gradientTop: {
    height: 128,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  card: {
    marginTop: -58,
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 14,
    ...RELATIVE_SHADOW,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  identityWrap: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  email: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  badge: {
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 10,
    fontWeight: "800",
  },
  metaText: {
    color: RELATIVE_COLORS.soft,
    fontSize: 10,
    fontWeight: "600",
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: RELATIVE_COLORS.teal,
  },
  completionBlock: {
    marginTop: 12,
  },
  completionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  completionLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  completionPct: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  statsRow: {
    marginTop: 12,
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    overflow: "hidden",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  statValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
    marginTop: 1,
    fontWeight: "600",
  },
});
