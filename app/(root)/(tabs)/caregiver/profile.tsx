import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants";
import { useUserStore } from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { BarChart } from "react-native-gifted-charts";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

// Mock Data for Charts
const earningsData = [
  { value: 150, label: "Mon", frontColor: "#1fb299" },
  { value: 200, label: "Tue", frontColor: "#a0bff0" },
  { value: 180, label: "Wed", frontColor: "#1fb299" },
  { value: 250, label: "Thu", frontColor: "#1fb299" },
  { value: 300, label: "Fri", frontColor: "#a0bff0" },
  { value: 170, label: "Sat", frontColor: "#1fb299" },
  { value: 90, label: "Sun", frontColor: "#e6e6e6" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

export default function CaregiverProfile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUserStore();
  const { profile, settings, isAvailable, toggleAvailability, toggleSetting } =
    useProfileStore();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HEADER SECTION */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#0d5c63", "#1fb299"]}
            style={styles.headerGradient}
          />
          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
              <Image source={icons.profile1} style={styles.avatar} />
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user?.name || "Caregiver"}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Pro Caregiver</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Image source={icons.edit} style={styles.editIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickStatsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.averageRating}★</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.experienceYears}y</Text>
                <Text style={styles.statLabel}>Exp.</Text>
              </View>
            </View>

            <View style={styles.availabilityRow}>
              <Text style={styles.availabilityLabel}>
                Status: {isAvailable ? "Taking Requests" : "Offline"}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailability}
                trackColor={{ false: "#e6e6e6", true: "#a0bff0" }}
                thumbColor={isAvailable ? "#1fb299" : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

      

        {/* PROFILE DETAILS */}
        <View style={styles.sectionContainer}>
          {renderSectionTitle("Caregiver Details")}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsLabel}>About Me</Text>
            <Text style={styles.detailsBio}>{profile.bio}</Text>

            <View style={styles.chipsSection}>
              <Text style={styles.detailsLabel}>Care Types</Text>
              <View style={styles.chipsRow}>
                {profile.careTypes.map((type) => (
                  <View key={type} style={styles.chip}>
                    <Text style={styles.chipText}>{type}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.chipsSection}>
              <Text style={styles.detailsLabel}>Languages</Text>
              <View style={styles.chipsRow}>
                {profile.languages.map((lang) => (
                  <View key={lang} style={[styles.chip, styles.chipLang]}>
                    <Text style={[styles.chipText, { color: "#0d5c63" }]}>
                      {lang}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* SETTINGS GROUPS */}
        <View style={styles.sectionContainer}>
          {renderSectionTitle("Settings")}

          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Notifications</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Booking Alerts</Text>
              <Switch
                value={settings.notifications.bookingAlerts}
                onValueChange={() =>
                  toggleSetting("notifications", "bookingAlerts")
                }
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Messages</Text>
              <Switch
                value={settings.notifications.messageAlerts}
                onValueChange={() =>
                  toggleSetting("notifications", "messageAlerts")
                }
              />
            </View>
          </View>

          <View style={styles.settingsGroup}>
            <Text style={styles.settingsGroupTitle}>Session Preferences</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingText}>
                Auto-Accept Familiar Elders
              </Text>
              <Switch
                value={settings.preferences.autoAccept}
                onValueChange={() => toggleSetting("preferences", "autoAccept")}
              />
            </View>
          </View>
        </View>

        {/* SAFETY & ACCOUNT */}
        {/* Logout Logic */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: "#ef4444" }]}>
            Danger Zone
          </Text>

          <View style={styles.settingsGroup}>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionText}>Help & Support</Text>
              <Image
                source={icons.arrowDown}
                style={[
                  styles.actionIcon,
                  { transform: [{ rotate: "-90deg" }] },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.actionRow}>
              <Text style={styles.actionText}>Terms & Privacy Safety</Text>
              <Image
                source={icons.arrowDown}
                style={[
                  styles.actionIcon,
                  { transform: [{ rotate: "-90deg" }] },
                ]}
              />
            </TouchableOpacity>
            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <Text style={styles.actionTextDanger}>Log Out</Text>
              <Image
                source={icons.out}
                style={[styles.actionIcon, { tintColor: "#ef4444" }]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  headerContainer: {
    paddingBottom: 20,
  },
  headerGradient: {
    height: 140,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  roleBadge: {
    backgroundColor: "#e6f8f5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    color: "#1fb299",
    fontSize: 10,
    fontWeight: "bold",
  },
  editBtn: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 20,
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: "#666",
  },
  quickStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0d5c63",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e6e6e6",
  },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 5,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  earningsSummaryRow: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 15,
  },
  earningsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  earningsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: "900",
  },
  chartCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1fb299",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  historySub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  historyRight: {
    alignItems: "flex-end",
  },
  historyPayout: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0d5c63",
  },
  historyDate: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  detailsBio: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
  },
  chipsSection: {
    marginBottom: 15,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  chipLang: {
    backgroundColor: "#e6f8f5",
  },
  settingsGroup: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  settingsGroupTitle: {
    fontSize: 12,
    color: "#888",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  actionTextDanger: {
    fontSize: 15,
    color: "#ef4444",
    fontWeight: "bold",
  },
  actionIcon: {
    width: 16,
    height: 16,
    tintColor: "#888",
  },
});
