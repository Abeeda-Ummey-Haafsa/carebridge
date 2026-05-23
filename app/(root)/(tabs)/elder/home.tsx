import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { icons } from "@/constants";
import { useElderDashboardStore } from "@/store/elderDashboardStore";

import {
  ActionModal,
  CaregiverInfoCard,
  CareStatusCard,
  ElderHeader,
  NeedHelpButton,
  ReassuranceBanner,
  RelativeContactCard,
  SOSButton,
} from "./components";
import { ELDER_COLORS, ELDER_RADIUS } from "./theme";

const formatDateTime = (date: Date) => {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);

  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${dateLabel} • ${timeLabel}`;
};

export default function ElderHome() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    sessionStatus,
    sosState,
    helpState,
    activeModal,
    caregiver,
    relative,
    reassuranceMessages,
    reassuranceIndex,
    accessibility,
    requestSOS,
    confirmSOS,
    requestHelp,
    confirmHelp,
    setActiveModal,
    advanceReassurance,
    setAccessibility,
  } = useElderDashboardStore();

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    const reassuranceTimer = setInterval(() => advanceReassurance(), 8000);
    const bootstrap = setTimeout(() => setLoading(false), 650);

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setAccessibility({ reduceMotion: enabled });
    });

    const reduceMotionSub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (enabled) => setAccessibility({ reduceMotion: enabled }),
    );

    return () => {
      clearInterval(timer);
      clearInterval(reassuranceTimer);
      clearTimeout(bootstrap);
      reduceMotionSub?.remove?.();
    };
  }, [advanceReassurance, setAccessibility]);

  const reassurance =
    reassuranceMessages[reassuranceIndex % reassuranceMessages.length];
  const timeLabel = useMemo(() => formatDateTime(currentTime), [currentTime]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={ELDER_COLORS.primary} />
            <Text style={styles.loadingTitle}>
              Preparing your care dashboard
            </Text>
            <Text style={styles.loadingText}>
              Your emergency help screen is loading.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ElderHeader
          name="Margaret"
          timeLabel={timeLabel}
          statusLabel="Care support ready"
          reduceMotion={accessibility.reduceMotion}
          onLogout={handleLogout}
        />

        <CareStatusCard
          caregiver={caregiver}
          sessionStatus={sessionStatus}
          reducedMotion={accessibility.reduceMotion}
          onPress={() => setActiveModal("caregiver-arriving")}
        />

        <SOSButton
          reduceMotion={accessibility.reduceMotion}
          active={sosState === "sent"}
          onPress={requestSOS}
        />

        <NeedHelpButton
          busy={helpState === "confirming"}
          onPress={requestHelp}
        />

        <CaregiverInfoCard
          caregiver={caregiver}
          onCallRelative={() => setActiveModal("relative-contact")}
          onViewSession={() => setActiveModal("caregiver-arriving")}
        />

        <RelativeContactCard
          relative={relative}
          onPress={() => setActiveModal("relative-contact")}
        />

        <ReassuranceBanner
          message={reassurance.message}
          tone={reassurance.tone}
          reduceMotion={accessibility.reduceMotion}
        />
      </ScrollView>

      <ActionModal
        visible={activeModal === "sos-confirm"}
        tone="danger"
        title="Send emergency help?"
        message="This will notify your family and the care team right away."
        primaryLabel="Send SOS"
        secondaryLabel="Cancel"
        onPrimary={confirmSOS}
        onSecondary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />

      <ActionModal
        visible={activeModal === "help-confirm"}
        tone="calm"
        title="Ask for help?"
        message="Your caregiver and family will see that you need support."
        primaryLabel="Send Help Request"
        secondaryLabel="Not now"
        onPrimary={confirmHelp}
        onSecondary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />

      <ActionModal
        visible={activeModal === "sos-sent"}
        tone="success"
        title="Emergency alert sent"
        message="Your family has been notified. Stay where you are and wait for help."
        primaryLabel="Okay"
        onPrimary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />

      <ActionModal
        visible={activeModal === "help-sent"}
        tone="success"
        title="Help request sent"
        message="Your caregiver and family know that you want support."
        primaryLabel="Okay"
        onPrimary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />

      <ActionModal
        visible={activeModal === "caregiver-arriving"}
        tone="calm"
        title="Caregiver status"
        message={`${caregiver.name} is ${caregiver.etaLabel.toLowerCase()}.`}
        primaryLabel="Understood"
        onPrimary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />

      <ActionModal
        visible={activeModal === "relative-contact"}
        tone="calm"
        title="Relative contact"
        message={`${relative.name} is ready to receive alerts and call you back.`}
        primaryLabel={relative.phoneLabel}
        secondaryLabel="Close"
        onPrimary={() => setActiveModal(null)}
        onSecondary={() => setActiveModal(null)}
        onDismiss={() => setActiveModal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ELDER_COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 4, android: 12, default: 8 }),
    paddingBottom: 28,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: ELDER_RADIUS.xl,
    backgroundColor: ELDER_COLORS.surface,
    padding: 22,
    alignItems: "center",
    gap: 12,
  },
  loadingTitle: {
    color: ELDER_COLORS.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  loadingText: {
    color: ELDER_COLORS.textSoft,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    textAlign: "center",
  },
});
