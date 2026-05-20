import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants";
import { create } from "zustand";
import { useUserStore } from "@/store";

interface CaregiverState {
  isAvailable: boolean;
  toggleAvailability: () => void;
}

export const useCaregiverStore = create<CaregiverState>((set) => ({
  isAvailable: true,
  toggleAvailability: () =>
    set((state) => ({ isAvailable: !state.isAvailable })),
}));

// Mock Data
const activeSessionMock = {
  elderName: "Elena Rodriguez",
  sessionType: "Medical Care",
  duration: "2 hrs",
  elapsedText: "01:14:23",
};

const requestsMock = [
  {
    id: "1",
    elderName: "Arthur Pendelton",
    careType: "Companionship",
    time: "Tomorrow, 2:00 PM",
    distance: "2.4 mi away",
  },
];

const scheduleMock = [
  {
    id: "1",
    timeFrame: "09:00 AM - 11:00 AM",
    elderName: "Elena Rodriguez",
    sessionType: "Medical Care",
    status: "In Progress",
  },
];

export default function Home() {
  const { isAvailable, toggleAvailability } = useCaregiverStore();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for early fetch
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1500);
  };

  if (loading) {
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
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={icons.profile} style={styles.profileImage} />
            <View>
              <Text style={styles.greeting}>
                Hi, {user?.name?.split(" ")[0] || "Caregiver"}
              </Text>
              <Text style={styles.subGreeting}>Ready for today?</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Switch
              value={isAvailable}
              onValueChange={toggleAvailability}
              trackColor={{ false: "#ccc", true: "#a0bff0" }}
              thumbColor={isAvailable ? "#1fb299" : "#f4f3f4"}
            />
            <TouchableOpacity style={styles.notificationBtn}>
              <Image
                source={icons.notification}
                style={styles.notificationIcon}
              />
              <View style={styles.badge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Session Card */}
        <View style={styles.activeSessionCard}>
          <View style={styles.activeSessionHeader}>
            <View style={styles.activeDot} />
            <Text style={styles.activeSessionText}>ACTIVE SESSION</Text>
          </View>
          <View style={styles.activeSessionBody}>
            <View>
              <Text style={styles.elderName}>
                {activeSessionMock.elderName}
              </Text>
              <Text style={styles.sessionType}>
                {activeSessionMock.sessionType} • {activeSessionMock.duration}
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <Text style={styles.timer}>{activeSessionMock.elapsedText}</Text>
              <Text style={styles.timerLabel}>Elapsed Time</Text>
            </View>
          </View>
          <View style={styles.activeSessionActions}>
            <TouchableOpacity style={[styles.actionButton, styles.checkOutBtn]}>
              <Text style={styles.checkOutBtnText}>Check Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.notesBtn]}>
              <Text style={styles.notesBtnText}>Notes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* New Requests Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Requests</Text>
          <View style={styles.requestBadge}>
            <Text style={styles.requestBadgeText}>{requestsMock.length}</Text>
          </View>
        </View>

        {requestsMock.map((req) => (
          <View key={req.id} style={styles.requestCard}>
            <View style={styles.requestInfo}>
              <Image source={icons.woman} style={styles.requestAvatar} />
              <View>
                <Text style={styles.requestName}>{req.elderName}</Text>
                <Text style={styles.requestType}>
                  {req.careType} • {req.time}
                </Text>
                <View style={styles.locationContainer}>
                  <Image source={icons.pin} style={styles.pinIcon} />
                  <Text style={styles.requestDistance}>{req.distance}</Text>
                </View>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.declineBtn}>
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Today's Schedule */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {scheduleMock.map((sched) => (
          <View key={sched.id} style={styles.scheduleCard}>
            <View style={styles.scheduleTimeline}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineLine} />
            </View>
            <View style={styles.scheduleContent}>
              <View style={styles.scheduleHeaderRow}>
                <Text style={styles.scheduleTime}>{sched.timeFrame}</Text>
                <Text style={styles.scheduleStatus}>{sched.status}</Text>
              </View>
              <Text style={styles.scheduleName}>{sched.elderName}</Text>
              <Text style={styles.scheduleCareType}>{sched.sessionType}</Text>
              <TouchableOpacity style={styles.navigateBtn}>
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
  },
  scheduleTime: {
    fontSize: 12,
    color: "#1fb299",
    fontWeight: "bold",
  },
  scheduleStatus: {
    fontSize: 10,
    color: "#1fb299",
    backgroundColor: "#e6f8f5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
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
