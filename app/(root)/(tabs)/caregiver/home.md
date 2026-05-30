import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { icons } from "@/constants";
import { useUserStore } from "@/store";
import { useCaregiver } from "@/hooks/useCaregiver";
import { useActiveSession } from "@/hooks/useActiveSession";
import {
  useAcceptRequest,
  useDeclineRequest,
  useNearbyRequests,
} from "@/hooks/useNearbyRequests";
import { useTodaySchedule } from "@/hooks/useTodaySchedule";
import { useToggleAvailability } from "@/hooks/useToggleAvailability";

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#d0e8e4",
          opacity,
        },
        style,
      ]}
    />
  );
}

function useElapsedTimer(initialSeconds: number, isActive: boolean) {
  const [elapsed, setElapsed] = useState(initialSeconds);

  useEffect(() => {
    setElapsed(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDistance(km: number): string {
  return km < 1
    ? `${Math.round(km * 1000)} m away`
    : `${km.toFixed(1)} km away`;
}

function formatTimeFrame(scheduledAt: string, durationMinutes: number): string {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const options = { hour: "2-digit" as const, minute: "2-digit" as const };
  return `${start.toLocaleTimeString([], options)} - ${end.toLocaleTimeString([], options)}`;
}

export default function Home() {
  const { user } = useUserStore();

  const {
    caregiver,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useCaregiver();

  const {
    activeSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useActiveSession();

  const {
    requests,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useNearbyRequests();

  const {
    schedule,
    isLoading: scheduleLoading,
    refetch: refetchSchedule,
  } = useTodaySchedule();

  const toggleAvailability = useToggleAvailability();
  const { acceptRequest, isAccepting } = useAcceptRequest();
  const { declineRequest, isDeclining } = useDeclineRequest();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchSession(),
      refetchRequests(),
      refetchSchedule(),
    ]);
    setRefreshing(false);
  }, [refetchProfile, refetchSession, refetchRequests, refetchSchedule]);

  const handleToggleAvailability = useCallback(() => {
    toggleAvailability.mutate();
  }, [toggleAvailability]);

  const handleAccept = useCallback(
    (sessionId: number) => {
      acceptRequest(sessionId);
    },
    [acceptRequest],
  );

  const handleDecline = useCallback(
    (sessionId: number) => {
      declineRequest(sessionId);
    },
    [declineRequest],
  );

  const isTimerActive =
    activeSession?.status === "checked_in" ||
    activeSession?.status === "paused";
  const elapsedText = useElapsedTimer(
    activeSession?.elapsed_seconds ?? 0,
    isTimerActive,
  );

  const showProfileWarning = profileError && !caregiver;
  //   const unreadCount = caregiver?.unread_notifications ?? 0;
  const isAvailable = caregiver?.is_available ?? false;

  if (profileLoading && !caregiver) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { marginBottom: 24 }]}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <SkeletonBox width={44} height={44} borderRadius={22} />
              <View style={{ gap: 6 }}>
                <SkeletonBox width={120} height={14} />
                <SkeletonBox width={80} height={10} />
              </View>
            </View>
            <SkeletonBox width={50} height={28} borderRadius={14} />
          </View>

          <SkeletonBox
            width="100%"
            height={160}
            borderRadius={24}
            style={{ marginBottom: 30 }}
          />

          <SkeletonBox width={140} height={16} style={{ marginBottom: 16 }} />
          <SkeletonBox
            width="100%"
            height={120}
            borderRadius={20}
            style={{ marginBottom: 24 }}
          />

          <SkeletonBox width={120} height={16} style={{ marginBottom: 16 }} />
          <SkeletonBox
            width="100%"
            height={100}
            borderRadius={20}
            style={{ marginBottom: 16 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1fb299"
          />
        }
      >
        {showProfileWarning && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Profile data is temporarily unavailable. Showing dashboard with
              limited data.
            </Text>
            <TouchableOpacity onPress={() => refetchProfile()}>
              <Text style={styles.warningAction}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={icons.profile} style={styles.profileImage} />
            <View>
              <Text style={styles.greeting}>
                Hi,{" "}
                {caregiver?.name?.split(" ")[0] ||
                  user?.name?.split(" ")[0] ||
                  "Caregiver"}
              </Text>
              <Text style={styles.subGreeting}>
                {isAvailable ? "You're online ✓" : "You're offline"}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: "#ccc", true: "#a0bff0" }}
              thumbColor={isAvailable ? "#1fb299" : "#f4f3f4"}
              disabled={toggleAvailability.isPending}
            />

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push("/(root)/(tabs)/caregiver/profile")}
            >
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
              />
              {/* {unreadCount > 0 && <View style={styles.badge} />} */}
            </TouchableOpacity>
          </View>
        </View>

        {sessionLoading && !activeSession ? (
          <SkeletonBox
            width="100%"
            height={160}
            borderRadius={24}
            style={{ marginBottom: 30 }}
          />
        ) : activeSession ? (
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionHeader}>
              <View style={styles.activeDot} />
              <Text style={styles.activeSessionText}>ACTIVE SESSION</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {activeSession.status.replace(/_/g, " ").toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.activeSessionBody}>
              <View>
                <Text style={styles.elderName}>{activeSession.elder_name}</Text>
                <Text style={styles.sessionType}>
                  {activeSession.care_type.replace(/_/g, " ")} •{" "}
                  {activeSession.duration_minutes ?? 0} min
                </Text>
              </View>
              <View style={styles.timerContainer}>
                <Text style={styles.timer}>{elapsedText}</Text>
                <Text style={styles.timerLabel}>Elapsed Time</Text>
              </View>
            </View>

            <View style={styles.activeSessionActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.checkOutBtn]}
                onPress={() =>
                  router.push("/(root)/(tabs)/caregiver/active-session")
                }
              >
                <Text style={styles.checkOutBtnText}>Check Out</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.notesBtn]}
                onPress={() =>
                  router.push("/(root)/(tabs)/caregiver/active-session")
                }
              >
                <Text style={styles.notesBtnText}>Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.activeSessionCard, styles.noSessionCard]}>
            <Text style={styles.noSessionText}>No active session</Text>
            <Text style={styles.noSessionSub}>
              {isAvailable
                ? "Waiting for new requests…"
                : "Go online to start receiving requests"}
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Requests</Text>
          {requestsLoading ? (
            <ActivityIndicator size="small" color="#1fb299" />
          ) : (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{requests.length}</Text>
            </View>
          )}
        </View>

        {requestsLoading && requests.length === 0 ? (
          <>
            <SkeletonBox
              width="100%"
              height={120}
              borderRadius={20}
              style={{ marginBottom: 16 }}
            />
            <SkeletonBox
              width="100%"
              height={120}
              borderRadius={20}
              style={{ marginBottom: 24 }}
            />
          </>
        ) : requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No new requests nearby</Text>
          </View>
        ) : (
          requests.map((req) => (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <Image source={icons.woman} style={styles.requestAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.requestName}>{req.elder_name}</Text>
                  <Text style={styles.requestType}>
                    {req.care_type.replace(/_/g, " ")} •{" "}
                    {formatScheduledAt(req.scheduled_at)}
                  </Text>
                  <View style={styles.locationContainer}>
                    <Image source={icons.pin} style={styles.pinIcon} />
                    <Text style={styles.requestDistance}>
                      {req.distance_km == null
                        ? "Distance unavailable"
                        : formatDistance(req.distance_km)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.payText}>
                  ${req.estimated_pay.toFixed(2)}
                </Text>
              </View>

              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={[
                    styles.declineBtn,
                    (isDeclining || isAccepting) && { opacity: 0.6 },
                  ]}
                  disabled={isDeclining || isAccepting}
                  onPress={() => handleDecline(req.id)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.acceptBtn,
                    (isAccepting || isDeclining) && { opacity: 0.6 },
                  ]}
                  disabled={isAccepting || isDeclining}
                  onPress={() => handleAccept(req.id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity
            onPress={() =>
              router.push("/(root)/(tabs)/caregiver/session-history")
            }
          >
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {scheduleLoading && schedule.length === 0 ? (
          <>
            <SkeletonBox
              width="100%"
              height={100}
              borderRadius={20}
              style={{ marginBottom: 16 }}
            />
            <SkeletonBox
              width="100%"
              height={100}
              borderRadius={20}
              style={{ marginBottom: 16 }}
            />
          </>
        ) : schedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No sessions scheduled today</Text>
          </View>
        ) : (
          schedule.map((sched) => (
            <View key={sched.id} style={styles.scheduleCard}>
              <View style={styles.scheduleTimeline}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleHeaderRow}>
                  <Text style={styles.scheduleTime}>
                    {formatTimeFrame(
                      sched.scheduled_at,
                      sched.duration_minutes,
                    )}
                  </Text>
                  <Text style={styles.scheduleStatus}>
                    {sched.status.replace(/_/g, " ")}
                  </Text>
                </View>
                <Text style={styles.scheduleName}>{sched.elder_name}</Text>
                <Text style={styles.scheduleCareType}>
                  {sched.care_type.replace(/_/g, " ")}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#a0bff0",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#0d5c63",
    padding: 16,
    borderRadius: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  subGreeting: {
    fontSize: 12,
    color: "#e0e0e0",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationBtn: {
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.15)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationIcon: {
    width: 20,
    height: 20,
    tintColor: "#fff",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  activeSessionCard: {
    backgroundColor: "#1fb299",
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  noSessionCard: {
    opacity: 0.95,
  },
  noSessionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  noSessionSub: {
    color: "#e6f8f5",
    fontSize: 12,
  },
  activeSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  activeSessionText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusPill: {
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  activeSessionBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  elderName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sessionType: {
    color: "#e6f8f5",
    fontSize: 12,
  },
  timerContainer: {
    alignItems: "flex-end",
  },
  timer: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  timerLabel: {
    color: "#e6f8f5",
    fontSize: 10,
  },
  activeSessionActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  checkOutBtn: {
    backgroundColor: "#fff",
  },
  checkOutBtnText: {
    color: "#1fb299",
    fontWeight: "bold",
  },
  notesBtn: {
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  notesBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  requestBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  seeAllText: {
    color: "#1fb299",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  requestInfo: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  requestType: {
    fontSize: 12,
    color: "#a0bff0",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pinIcon: {
    width: 10,
    height: 10,
    tintColor: "#1fb299",
  },
  requestDistance: {
    fontSize: 12,
    color: "#888",
  },
  payText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#050b14",
    marginLeft: 8,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  declineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  declineText: {
    color: "#666",
  },
  acceptBtn: {
    backgroundColor: "#050b14",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  acceptText: {
    color: "#fff",
    fontWeight: "bold",
  },
  scheduleCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  scheduleTimeline: {
    alignItems: "center",
    marginRight: 16,
    marginTop: 4,
    width: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1fb299",
    marginBottom: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  scheduleTime: {
    fontSize: 12,
    color: "#1fb299",
    fontWeight: "bold",
    flexShrink: 1,
  },
  scheduleStatus: {
    fontSize: 10,
    color: "#1fb299",
    backgroundColor: "#e6f8f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  scheduleCareType: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  navigateIcon: {
    width: 14,
    height: 14,
    tintColor: "#1fb299",
  },
  navigateText: {
    color: "#1fb299",
    fontSize: 12,
    fontWeight: "bold",
  },
  warningBanner: {
    backgroundColor: "#fff3cd",
    borderColor: "#f2d58a",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  warningText: {
    flex: 1,
    color: "#7a5d00",
    fontSize: 12,
    fontWeight: "600",
  },
  warningAction: {
    color: "#1f7a6e",
    fontSize: 12,
    fontWeight: "800",
  },
});
