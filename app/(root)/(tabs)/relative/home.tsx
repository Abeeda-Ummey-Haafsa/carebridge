import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { useUserStore } from "@/store";
import { useRelativeDashboardStore } from "@/store/relativeDashboardStore";

import DashboardHeader from "./components/DashboardHeader";
import ActiveSessionCard from "./components/ActiveSessionCard";
import BookingCTA from "./components/BookingCTA";
import UpcomingBookingCard from "./components/UpcomingBookingCard";
import ElderStatusCard from "./components/ElderStatusCard";
import ActivityFeed from "./components/ActivityFeed";
import EmergencyAlertCard from "./components/EmergencyAlertCard";
import DashboardSkeleton from "./components/DashboardSkeleton";
import {
  ELDER_ACTIVITY_UPDATES,
  EMERGENCY_ALERTS,
  QUICK_CARE_OPTIONS,
  RELATIVE_ACTIVE_SESSIONS,
  RELATIVE_ELDERS,
  UPCOMING_BOOKINGS,
} from "./data";
import { RELATIVE_COLORS, RELATIVE_LAYOUT } from "./theme";
import {
  RelativeEmergencyAlert,
  RelativeBooking,
} from "@/types/relative-dashboard";

export default function RelativeHome() {
  const router = useRouter();
  const { user } = useUserStore();
  const {
    activeElderId,
    unreadNotifications,
    emergencyBadgeCount,
    dashboardSummary,
    setActiveElderId,
    setDashboardSummary,
  } = useRelativeDashboardStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const activeSessions = RELATIVE_ACTIVE_SESSIONS.filter(
      (session) => session.elderId === activeElderId,
    ).length;
    const upcomingBookings = UPCOMING_BOOKINGS.filter(
      (booking) => booking.elderId === activeElderId,
    ).length;
    const liveUpdates = ELDER_ACTIVITY_UPDATES.filter(
      (update) => update.elderId === activeElderId,
    ).length;

    setDashboardSummary({
      activeElders: RELATIVE_ELDERS.length,
      activeSessions,
      upcomingBookings,
      nearbyCaregivers: 18,
      unreadNotifications,
      emergencyAlerts: emergencyBadgeCount,
      liveUpdates,
    });
  }, [
    activeElderId,
    emergencyBadgeCount,
    setDashboardSummary,
    unreadNotifications,
  ]);

  const selectedElder = useMemo(
    () =>
      RELATIVE_ELDERS.find((elder) => elder.id === activeElderId) ??
      RELATIVE_ELDERS[0],
    [activeElderId],
  );

  const activeSession = useMemo(
    () =>
      RELATIVE_ACTIVE_SESSIONS.find(
        (session) => session.elderId === selectedElder.id,
      ),
    [selectedElder.id],
  );

  const filteredBookings = useMemo(
    () =>
      UPCOMING_BOOKINGS.filter(
        (booking) => booking.elderId === selectedElder.id,
      ),
    [selectedElder.id],
  );

  const filteredUpdates = useMemo(
    () =>
      ELDER_ACTIVITY_UPDATES.filter(
        (update) => update.elderId === selectedElder.id,
      ),
    [selectedElder.id],
  );

  const filteredAlerts = useMemo(
    () =>
      EMERGENCY_ALERTS.filter(
        (alert) =>
          alert.elderId === "all" || alert.elderId === selectedElder.id,
      ),
    [selectedElder.id],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const switchElder = useCallback(() => {
    const activeIndex = RELATIVE_ELDERS.findIndex(
      (elder) => elder.id === activeElderId,
    );
    const nextElder =
      RELATIVE_ELDERS[(activeIndex + 1) % RELATIVE_ELDERS.length];
    setActiveElderId(nextElder.id);
  }, [activeElderId, setActiveElderId]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleAction = useCallback((title: string, message: string) => {
    Alert.alert(title, message);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.ScrollView
        stickyHeaderIndices={[0]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={RELATIVE_COLORS.teal}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.stickyHeaderWrap}>
          <DashboardHeader
            userName={user?.name?.split(" ")[0] || "Sarah"}
            selectedElder={selectedElder}
            elderCount={RELATIVE_ELDERS.length}
            summary={dashboardSummary}
            scrollY={scrollY}
            onSwitchElder={switchElder}
            onOpenNotifications={() =>
              handleAction(
                "Notifications",
                "Open the notification inbox or center here.",
              )
            }
            onOpenEmergencyCenter={() =>
              handleAction(
                "Emergency Center",
                "Open urgent care and SOS shortcuts here.",
              )
            }
          />
        </View>

        <View style={styles.sectionStack}>
          <ActiveSessionCard
            session={activeSession}
            onViewLiveSession={() =>
              handleAction(
                "Live session",
                "Open the live session and map view here.",
              )
            }
            onOpenChat={() => router.push("/(root)/relative/chat")}
            onEmergencyContact={() =>
              handleAction(
                "Emergency contact",
                "Call the emergency contact shortcut here.",
              )
            }
          />

          <BookingCTA
            nearbyCaregivers={dashboardSummary.nearbyCaregivers}
            careOptions={QUICK_CARE_OPTIONS}
            onBookCareNow={() => router.push("/(root)/relative/find-care")}
          />

          <View style={styles.subHeaderRow}>
            <View>
              <Animated.Text style={styles.sectionTitle}>
                Upcoming Bookings
              </Animated.Text>
              <Animated.Text style={styles.sectionSubtitle}>
                Future care sessions and confirmation status.
              </Animated.Text>
            </View>
          </View>

          <Animated.FlatList
            data={filteredBookings}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <UpcomingBookingCard
                booking={item}
                index={index}
                onViewDetails={(booking: RelativeBooking) =>
                  handleAction(
                    "Booking details",
                    `${booking.caregiverName} on ${booking.dateLabel} at ${booking.timeLabel}.`,
                  )
                }
                onReschedule={(booking: RelativeBooking) =>
                  handleAction(
                    "Reschedule",
                    `Reschedule ${booking.careType} with ${booking.caregiverName}.`,
                  )
                }
                onCancelBooking={(booking: RelativeBooking) =>
                  handleAction(
                    "Cancel booking",
                    `Cancel ${booking.careType} for ${booking.elderName}.`,
                  )
                }
              />
            )}
            ListEmptyComponent={null}
            contentContainerStyle={styles.carousel}
          />

          <ElderStatusCard elder={selectedElder} />

          <ActivityFeed updates={filteredUpdates} />

          <EmergencyAlertCard
            alerts={filteredAlerts}
            onPressAlert={(alert: RelativeEmergencyAlert) =>
              handleAction(
                alert.title,
                `${alert.type} alert for ${selectedElder.name}.`,
              )
            }
          />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.screen,
  },
  content: {
    paddingBottom: 42,
  },
  stickyHeaderWrap: {
    zIndex: 10,
  },
  sectionStack: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 4,
  },
  subHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  carousel: {
    paddingVertical: 4,
    paddingRight: 10,
    paddingBottom: 12,
  },
});

