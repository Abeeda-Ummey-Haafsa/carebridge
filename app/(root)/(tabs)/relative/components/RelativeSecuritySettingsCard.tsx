import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch } from "react-native";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface RelativeSecuritySettingsCardProps {
  biometricLogin: boolean;
  onToggleBiometric: () => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
}

export const RelativeSecuritySettingsCard: React.FC<
  RelativeSecuritySettingsCardProps
> = ({ biometricLogin, onToggleBiometric, onLogout, onDeleteAccount }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Account & Security</Text>

      <View style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Password</Text>
          <Text style={styles.rowSubtitle}>Last updated 27 days ago</Text>
        </View>
        <Text style={styles.linkText}>Update</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Login Activity</Text>
          <Text style={styles.rowSubtitle}>
            Recent sign-ins and session history
          </Text>
        </View>
        <Text style={styles.linkText}>View</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Biometric Login</Text>
          <Text style={styles.rowSubtitle}>Use fingerprint or face unlock</Text>
        </View>
        <Switch
          value={biometricLogin}
          onValueChange={onToggleBiometric}
          trackColor={{ false: "#d8e9e6", true: "#9adacc" }}
          thumbColor={biometricLogin ? RELATIVE_COLORS.teal : "#f9f9f9"}
        />
      </View>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row}>
        <View>
          <Text style={styles.rowTitle}>Connected Devices</Text>
          <Text style={styles.rowSubtitle}>2 active devices</Text>
        </View>
        <Text style={styles.linkText}>Manage</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={onLogout}>
        <View>
          <Text style={[styles.rowTitle, { color: RELATIVE_COLORS.danger }]}>
            Log Out
          </Text>
          <Text style={styles.rowSubtitle}>
            Sign out securely from this device
          </Text>
        </View>
        <Text style={[styles.linkText, { color: RELATIVE_COLORS.danger }]}>
          Sign Out
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={onDeleteAccount}>
        <View>
          <Text style={[styles.rowTitle, { color: RELATIVE_COLORS.danger }]}>
            Delete Account
          </Text>
          <Text style={styles.rowSubtitle}>
            Permanent account and data removal placeholder
          </Text>
        </View>
        <Text style={[styles.linkText, { color: RELATIVE_COLORS.danger }]}>
          Delete
        </Text>
      </TouchableOpacity>
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
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  linkText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RELATIVE_COLORS.border,
    marginVertical: 4,
  },
});
