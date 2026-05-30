import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { icons } from "@/constants";
import { useCaregiver } from "@/hooks/useCaregiver";
import { useActiveSession } from "@/hooks/useActiveSession";
import { useNearbyRequests } from "@/hooks/useNearbyRequests";
import { useTodaySchedule } from "@/hooks/useTodaySchedule";
import { useCheckOut } from "@/hooks/useCheckOut";

function ElapsedTimer({ checkedInAt }: { checkedInAt: string | null }) {
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    if (!checkedInAt) {
      setElapsed("00:00:00");
      return;
    }

    const anchor = new Date(checkedInAt).getTime();
    const tick = () => {
      const diffMs = Date.now() - anchor;
      const totalSec = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSec / 3600)
        .toString()
        .padStart(2, "0");
      const mins = Math.floor((totalSec % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const secs = (totalSec % 60).toString().padStart(2, "0");
      setElapsed(`${hrs}:${mins}:${secs}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [checkedInAt]);

  return <Text style={styles.timer}>{elapsed}</Text>;
}

function formatScheduledAt(
  isoString: string,
  durationMinutes?: number,
): string {
  const start = new Date(isoString);
  const startLabel = start.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!durationMinutes) return startLabel;

  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const endLabel = end.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startLabel} – ${endLabel}`;
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    accepted: "Confirmed",
    arriving: "En Route",
    checked_in: "In Progress",
    paused: "Paused",
    completed: "Completed",
    cancelled: "Cancelled",
    declined: "Declined",
  };

  return map[status] ?? status;
}

export default function Home() {
  const {
    caregiver,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useCaregiver();

  const {
    activeSession,
    hasActiveSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useActiveSession();

  const {
    requests,
    isLoading: requestsLoading,
    refetch: refetchRequests,
    acceptRequest,
    declineRequest,
    isAccepting,
    isDeclining,
  } = useNearbyRequests();

  const {
    schedule,
    isLoading: scheduleLoading,
    refetch: refetchSchedule,
  } = useTodaySchedule();

  const { confirmCheckOut, isCheckingOut } = useCheckOut(
    activeSession?.sessionId ?? 0,
  );

  const [refreshing, setRefreshing] = useState(false);

  const isInitialLoading = profileLoading && !caregiver;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchProfile(),
      refetchSession(),
      refetchRequests(),
      refetchSchedule(),
    ]);
    setRefreshing(false);
  };

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={icons.profile} style={styles.profileImage} />
            <View>
              <Text style={styles.greeting}>
                Hi, {caregiver?.name?.trim().split(/\s+/)[0] ?? "Caregiver"}
              </Text>
              <Text style={styles.subGreeting}>
                {caregiver?.is_available ? "You're online ✓" : "You're Online"}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusPill,
                caregiver?.is_available
                  ? styles.statusPillOn
                  : styles.statusPillOff,
              ]}
            >
              <Text style={styles.statusPillText}>
                {caregiver?.is_available ? "Online" : "Online"}
              </Text>
            </View>
          </View>
        </View>

        {hasActiveSession && activeSession ? (
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionHeader}>
              <View style={styles.activeDot} />
              <Text style={styles.activeSessionText}>ACTIVE SESSION</Text>
            </View>
            <View style={styles.activeSessionBody}>
              <View>
                <Text style={styles.elderName}>{activeSession.elder_name}</Text>
                <Text style={styles.sessionType}>
                  {activeSession.care_type} • {activeSession.duration_minutes}{" "}
                  min
                </Text>
              </View>
              <View style={styles.timerContainer}>
                <ElapsedTimer checkedInAt={activeSession.checked_in_at} />
                <Text style={styles.timerLabel}>Elapsed Time</Text>
              </View>
            </View>
            <View style={styles.activeSessionActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.checkOutBtn]}
                onPress={confirmCheckOut}
                disabled={isCheckingOut}
              >
                <Text style={styles.checkOutBtnText}>
                  {isCheckingOut ? "Checking Out..." : "Check Out"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.notesBtn]}
                onPress={() =>
                  router.push(
                    `/(root)/(tabs)/caregiver/active-session?id=${activeSession.sessionId}`,
                  )
                }
              >
                <Text style={styles.notesBtnText}>Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !sessionLoading ? (
          <View style={[styles.activeSessionCard, { opacity: 0.6 }]}>
            <View style={styles.activeSessionHeader}>
              <View style={[styles.activeDot, { backgroundColor: "#ccc" }]} />
              <Text style={styles.activeSessionText}>NO ACTIVE SESSION</Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 14 }}>
              Accept a request below to start a session.
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Requests</Text>
          {requestsLoading ? (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>...</Text>
            </View>
          ) : (
            <View style={styles.requestBadge}>
              <Text style={styles.requestBadgeText}>{requests.length}</Text>
            </View>
          )}
        </View>

        {requestsLoading && requests.length === 0 && (
          <View style={[styles.requestCard, { height: 120, opacity: 0.4 }]} />
        )}

        {!requestsLoading && requests.length === 0 && (
          <View style={styles.requestCard}>
            <Text style={{ color: "#888", textAlign: "center", padding: 16 }}>
              No pending requests nearby
            </Text>
          </View>
        )}

        {requests.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Image source={icons.woman} style={styles.requestAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.requestName}>{req.elder_name}</Text>
                <Text style={styles.requestType}>
                  {req.care_type} • {formatScheduledAt(req.scheduled_at)}
                </Text>
                <View style={styles.locationContainer}>
                  <Image source={icons.pin} style={styles.pinIcon} />
                  <Text style={styles.requestDistance}>
                    {req.distance_km != null
                      ? `${req.distance_km.toFixed(1)} km away`
                      : "Nearby"}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#1fb299",
                    fontWeight: "bold",
                  }}
                >
                  Est. ${req.estimated_pay.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => declineRequest(req.id)}
                disabled={isDeclining}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptRequest(req.id)}
                disabled={isAccepting}
              >
                <Text style={styles.acceptText}>
                  {isAccepting ? "..." : "Accept"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

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

        {scheduleLoading && schedule.length === 0 && (
          <View style={[styles.scheduleCard, { height: 100, opacity: 0.4 }]} />
        )}

        {!scheduleLoading && schedule.length === 0 && (
          <View style={styles.scheduleCard}>
            <Text style={{ color: "#888", padding: 16 }}>
              No sessions scheduled for today
            </Text>
          </View>
        )}

        {schedule.map((sched) => (
          <View key={sched.id} style={styles.scheduleCard}>
            <View style={styles.scheduleTimeline}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleHeaderRow}>
                <Text style={styles.scheduleTime}>
                  {formatScheduledAt(
                    sched.scheduled_at,
                    sched.duration_minutes,
                  )}
                </Text>
                <Text style={styles.scheduleStatus}>
                  {formatStatus(sched.status)}
                </Text>
              </View>
              <Text style={styles.scheduleName}>{sched.elder_name}</Text>
              <Text style={styles.scheduleCareType}>{sched.care_type}</Text>
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() =>
                  router.push(
                    `/(root)/(tabs)/caregiver/active-session?id=${sched.id}`,
                  )
                }
              >
                <Image
                  source={icons.map}
                  style={styles.navigateIcon}
                  resizeMode="contain"
                />
                <Text style={styles.navigateText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

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
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusPillOn: {
    backgroundColor: "rgba(31, 178, 153, 0.18)",
  },
  statusPillOff: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  statusPillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
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
});
