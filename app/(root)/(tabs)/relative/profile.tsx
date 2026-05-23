import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import {
  selectProfileQuickStats,
  useRelativeProfileStore,
} from "@/store/relativeProfileStore";
import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "./theme";
import { RelativeAnalyticsWidget } from "./components/RelativeAnalyticsWidget";
import { RelativeElderCard } from "./components/RelativeElderCard";
import { RelativeEmergencyContactCard } from "./components/RelativeEmergencyContactCard";
import { RelativeNotificationSettingItem } from "./components/RelativeNotificationSettingItem";
import { RelativePaymentMethodCard } from "./components/RelativePaymentMethodCard";
import { RelativePreferenceItem } from "./components/RelativePreferenceItem";
import { RelativeProfileHeader } from "./components/RelativeProfileHeader";
import { RelativeProfileLoading } from "./components/RelativeProfileLoading";
import { RelativeSecuritySettingsCard } from "./components/RelativeSecuritySettingsCard";
import { RelativeSupportSection } from "./components/RelativeSupportSection";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <Animated.View
      entering={FadeInDown.duration(250)}
      style={styles.sectionWrap}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.groupCard}>{children}</View>
    </Animated.View>
  );
};

export default function RelativeProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const scrollY = useSharedValue(0);

  const {
    isLoading,
    profile,
    elders,
    selectedElderId,
    paymentMethods,
    emergencyContacts,
    notifications,
    preferences,
    security,
    stats,
    monthlySpendTrend,
    bookingTrend,
    selectElder,
    toggleElderExpanded,
    addMockElder,
    toggleNotification,
    togglePreference,
    toggleSecurity,
    setThemeMode,
  } = useRelativeProfileStore();

  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const quickStats = useMemo(
    () =>
      selectProfileQuickStats(
        elders.length,
        stats.activeSessions,
        stats.completedBookings,
        emergencyContacts.length,
      ),
    [
      elders.length,
      emergencyContacts.length,
      stats.activeSessions,
      stats.completedBookings,
    ],
  );

  const completionWarning = profile.profileCompletion < 100;

  const stickyBarStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 110],
          [0, -4],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [0.95, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <RelativeProfileLoading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AnimatedScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RELATIVE_COLORS.teal}
          />
        }
      >
        <RelativeProfileHeader
          profile={profile}
          quickStats={quickStats}
          onEditPress={() =>
            Alert.alert("Edit Profile", "Open profile edit form")
          }
        />

        <Animated.View style={[styles.stickySwitcher, stickyBarStyle]}>
          <View style={styles.stickyIdentityRow}>
            <View>
              <Text style={styles.stickyName}>{profile.fullName}</Text>
              <Text style={styles.stickySubtitle}>
                {profile.profileCompletion}% profile complete
              </Text>
            </View>
            <Text style={styles.stickyTitle}>Managed Elder</Text>
          </View>
          <View style={styles.switcherPills}>
            {elders.map((elder) => {
              const selected = elder.id === selectedElderId;
              return (
                <TouchableOpacity
                  key={elder.id}
                  style={[
                    styles.switcherPill,
                    selected && styles.switcherPillActive,
                  ]}
                  onPress={() => selectElder(elder.id)}
                >
                  <Text
                    style={[
                      styles.switcherPillText,
                      selected && styles.switcherPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {elder.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        <SectionCard title="Elder Management">
          {elders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No elders linked yet</Text>
              <Text style={styles.emptyText}>
                Add an elder profile to start scheduling care.
              </Text>
            </View>
          ) : (
            elders.map((elder) => (
              <RelativeElderCard
                key={elder.id}
                elder={elder}
                selected={selectedElderId === elder.id}
                onSelect={() => selectElder(elder.id)}
                onToggleExpand={() => toggleElderExpanded(elder.id)}
                onViewProfile={() =>
                  Alert.alert(
                    "Elder Profile",
                    `Open ${elder.name} profile details`,
                  )
                }
                onEditInfo={() =>
                  Alert.alert("Edit Elder", `Edit profile for ${elder.name}`)
                }
                onEmergencyContacts={() =>
                  Alert.alert(
                    "Emergency Contacts",
                    `Manage contacts for ${elder.name}`,
                  )
                }
              />
            ))
          )}

          <TouchableOpacity style={styles.addCta} onPress={addMockElder}>
            <Text style={styles.addCtaText}>+ Add New Elder</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Payment Methods">
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No payment methods</Text>
              <Text style={styles.emptyText}>
                Add a card to pay for caregiving sessions.
              </Text>
            </View>
          ) : (
            paymentMethods.map((payment) => (
              <RelativePaymentMethodCard
                key={payment.id}
                payment={payment}
                onManage={() =>
                  Alert.alert("Payment", "Open payment method settings")
                }
              />
            ))
          )}

          <View style={styles.inlineActions}>
            <TouchableOpacity style={styles.addSmallCta}>
              <Text style={styles.addSmallCtaText}>Add Payment Method</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addSmallCta}>
              <Text style={styles.addSmallCtaText}>Payment History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.billingSummary}>
            <View style={styles.billingCell}>
              <Text style={styles.billingLabel}>Default Method</Text>
              <Text style={styles.billingValue}>
                {paymentMethods.find((item) => item.isDefault)?.brand ?? "Card"}{" "}
                ending{" "}
                {paymentMethods.find((item) => item.isDefault)?.last4 ?? "----"}
              </Text>
            </View>
            <View style={styles.billingCell}>
              <Text style={styles.billingLabel}>This Month</Text>
              <Text style={styles.billingValue}>৳ {stats.monthlySpend}</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Notification Settings">
          <RelativeNotificationSettingItem
            label="Session Updates"
            description="Receive ongoing care update notifications"
            value={notifications.sessionUpdates}
            onToggle={() => toggleNotification("sessionUpdates")}
          />
          <View style={styles.divider} />
          <RelativeNotificationSettingItem
            label="Caregiver Messages"
            description="Alerts when caregivers send messages"
            value={notifications.caregiverMessages}
            onToggle={() => toggleNotification("caregiverMessages")}
          />
          <View style={styles.divider} />
          <RelativeNotificationSettingItem
            label="Emergency Alerts"
            description="High-priority emergency safety alerts"
            value={notifications.emergencyAlerts}
            onToggle={() => toggleNotification("emergencyAlerts")}
          />
          <View style={styles.divider} />
          <RelativeNotificationSettingItem
            label="Booking Reminders"
            description="Upcoming care booking reminders"
            value={notifications.bookingReminders}
            onToggle={() => toggleNotification("bookingReminders")}
          />
          <View style={styles.divider} />
          <RelativeNotificationSettingItem
            label="Payment Notifications"
            description="Billing and payment status updates"
            value={notifications.paymentNotifications}
            onToggle={() => toggleNotification("paymentNotifications")}
          />
          <View style={styles.divider} />
          <RelativeNotificationSettingItem
            label="Caregiver Arrival Alerts"
            description="Live arrival status and ETA"
            value={notifications.caregiverArrivalAlerts}
            onToggle={() => toggleNotification("caregiverArrivalAlerts")}
          />
        </SectionCard>

        <SectionCard title="Emergency & Safety">
          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No emergency contacts</Text>
              <Text style={styles.emptyText}>
                Add at least one emergency contact for safety workflows.
              </Text>
            </View>
          ) : (
            emergencyContacts.map((contact) => (
              <RelativeEmergencyContactCard
                key={contact.id}
                contact={contact}
                onPress={() => Alert.alert("Contact", `Manage ${contact.name}`)}
              />
            ))
          )}

          <View style={styles.inlineActions}>
            <TouchableOpacity style={[styles.addSmallCta, styles.safetyCta]}>
              <Text style={[styles.addSmallCtaText, styles.safetyText]}>
                Add Emergency Contact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addSmallCta, styles.safetyCta]}>
              <Text style={[styles.addSmallCtaText, styles.safetyText]}>
                SOS Preferences
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />
          <RelativePreferenceItem
            label="SOS Notifications"
            description="Escalate emergency alerts to all contacts"
            value={security.sosNotifications}
            onToggle={() => toggleSecurity("sosNotifications")}
          />
          <View style={styles.divider} />
          <RelativePreferenceItem
            label="Location Sharing"
            description="Share elder location during active emergencies"
            value={security.locationSharing}
            onToggle={() => toggleSecurity("locationSharing")}
          />
        </SectionCard>

        <SectionCard title="App Preferences">
          <RelativePreferenceItem
            label="Dark Mode"
            description="Preview dark surfaces for low-light use"
            value={preferences.darkMode}
            onToggle={() => togglePreference("darkMode")}
          />
          <View style={styles.divider} />
          <RelativePreferenceItem
            label="Accessibility Mode"
            description="Higher contrast and larger UI targets"
            value={preferences.accessibilityMode}
            onToggle={() => togglePreference("accessibilityMode")}
          />
          <View style={styles.divider} />
          <RelativePreferenceItem
            label="Reduce Motion"
            description="Simpler transitions for motion sensitivity"
            value={preferences.reduceMotion}
            onToggle={() => togglePreference("reduceMotion")}
          />
          <View style={styles.divider} />
          <RelativePreferenceItem
            label="Language"
            trailingText={preferences.language}
            onPress={() =>
              Alert.alert("Language", "Language selector placeholder")
            }
          />
          <View style={styles.divider} />
          <RelativePreferenceItem
            label="Font Scale"
            trailingText={preferences.fontScale}
            onPress={() =>
              Alert.alert("Font Scale", "Font scaling placeholder")
            }
          />

          <View style={styles.themeRow}>
            <TouchableOpacity
              style={[
                styles.themePill,
                preferences.themeMode === "system" && styles.themePillActive,
              ]}
              onPress={() => setThemeMode("system")}
            >
              <Text
                style={[
                  styles.themePillText,
                  preferences.themeMode === "system" &&
                    styles.themePillTextActive,
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themePill,
                preferences.themeMode === "light" && styles.themePillActive,
              ]}
              onPress={() => setThemeMode("light")}
            >
              <Text
                style={[
                  styles.themePillText,
                  preferences.themeMode === "light" &&
                    styles.themePillTextActive,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themePill,
                preferences.themeMode === "dark" && styles.themePillActive,
              ]}
              onPress={() => setThemeMode("dark")}
            >
              <Text
                style={[
                  styles.themePillText,
                  preferences.themeMode === "dark" &&
                    styles.themePillTextActive,
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </SectionCard>

        <SectionCard title="Activity & Booking Summary">
          <RelativeAnalyticsWidget
            activeSessions={stats.activeSessions}
            completedBookings={stats.completedBookings}
            monthlySpend={stats.monthlySpend}
            averageCaregiverRating={stats.averageCaregiverRating}
            monthlySpendTrend={monthlySpendTrend}
            bookingTrend={bookingTrend}
          />
        </SectionCard>

        <SectionCard title="Account & Security">
          <RelativeSecuritySettingsCard
            biometricLogin={security.biometricLogin}
            onToggleBiometric={() => toggleSecurity("biometricLogin")}
            onLogout={() => setLogoutModalVisible(true)}
            onDeleteAccount={() =>
              Alert.alert("Delete Account", "Delete account placeholder flow")
            }
          />
        </SectionCard>

        <SectionCard title="Support & Help">
          <RelativeSupportSection
            onPressItem={(key) =>
              Alert.alert("Support", `Open ${key} placeholder flow`)
            }
          />
        </SectionCard>

        {completionWarning && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Profile is incomplete</Text>
            <Text style={styles.warningText}>
              Complete your profile details to unlock smoother booking
              management and safety setup.
            </Text>
            <TouchableOpacity style={styles.warningBtn}>
              <Text style={styles.warningBtnText}>Complete Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </AnimatedScrollView>

      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Out of CareBridge?</Text>
            <Text style={styles.modalBody}>
              You can sign back in anytime. Active care data remains safe.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={handleLogout}
              >
                <Text style={styles.modalDangerText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.screen,
  },
  content: {
    paddingBottom: 40,
  },
  stickySwitcher: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: 6,
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stickyTitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  stickyIdentityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  stickyName: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  stickySubtitle: {
    marginTop: 1,
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
  },
  switcherPills: {
    flexDirection: "row",
    gap: 7,
    flexWrap: "wrap",
  },
  switcherPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  switcherPillActive: {
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  switcherPillText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 74,
  },
  switcherPillTextActive: {
    color: "#fff",
  },
  sectionWrap: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: RELATIVE_LAYOUT.sectionGap,
  },
  sectionTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  groupCard: {
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RELATIVE_COLORS.border,
    marginVertical: 4,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    padding: 12,
  },
  emptyTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 4,
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
  },
  addCta: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  addCtaText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 13,
    fontWeight: "800",
  },
  inlineActions: {
    marginTop: 8,
    flexDirection: "row",
    gap: 8,
  },
  addSmallCta: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addSmallCtaText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  billingSummary: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    padding: 10,
    gap: 6,
  },
  billingCell: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billingLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  billingValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  safetyCta: {
    borderColor: "#fecaca",
    backgroundColor: "#fff8f8",
  },
  safetyText: {
    color: RELATIVE_COLORS.danger,
  },
  themeRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  themePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
  },
  themePillActive: {
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  themePillText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
  themePillTextActive: {
    color: "#fff",
  },
  warningCard: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: RELATIVE_LAYOUT.sectionGap,
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    padding: 12,
  },
  warningTitle: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "800",
  },
  warningText: {
    marginTop: 4,
    color: "#92400e",
    fontSize: 12,
    lineHeight: 18,
  },
  warningBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 10,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  warningBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 14,
  },
  modalTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  modalBody: {
    marginTop: 6,
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalCancelBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCancelText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  modalDangerBtn: {
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalDangerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
