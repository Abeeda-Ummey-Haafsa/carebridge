import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  Image,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { icons } from "@/constants";
import {
  useSessionHistoryStore,
  CareSession,
  SessionStatus,
} from "@/store/sessionHistoryStore";
import { BarChart } from "react-native-gifted-charts";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

// ----------------------------------------------------
// Analytics Card Component
// ----------------------------------------------------
const AnalyticsCard = () => {
  const barData = [
    { value: 120, label: "M", frontColor: "#1fb299" },
    { value: 90, label: "T", frontColor: "#a0bff0" },
    { value: 150, label: "W", frontColor: "#1fb299" },
    { value: 200, label: "T", frontColor: "#1fb299" },
    { value: 170, label: "F", frontColor: "#a0bff0" },
    { value: 80, label: "S", frontColor: "#e6e6e6" },
  ];

  return (
    <View style={styles.analyticsCard}>
      <Text style={styles.sectionTitle}>Earnings & Activity</Text>
      <View style={styles.analyticsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg. Payout</Text>
          <Text style={styles.statValue}>{formatCurrency(85.5)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Top Care Type</Text>
          <Text style={styles.statValueText}>Medical Care</Text>
        </View>
      </View>
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          barWidth={18}
          spacing={12}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: "#888", fontSize: 10 }}
          noOfSections={3}
          maxValue={250}
          isAnimated
        />
      </View>
    </View>
  );
};

// ----------------------------------------------------
// Main Screen Export
// ----------------------------------------------------
export default function SessionHistoryScreen() {
  const {
    sessions,
    activeFilter,
    searchQuery,
    selectedSession,
    isLoading,
    setFilter,
    setSearchQuery,
    setSelectedSession,
    setLoading,
  } = useSessionHistoryStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Group and sort sessions
  const groupedSessions = useMemo(() => {
    // 1. Filter by status
    let filtered = sessions;
    if (activeFilter !== "All") {
      filtered = filtered.filter((s) => s.status === activeFilter);
    }
    // 2. Filter by search
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.elderName.toLowerCase().includes(lowerQ) ||
          s.careType.toLowerCase().includes(lowerQ),
      );
    }

    // 3. Sort (newest first mock)
    filtered.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // 4. Group by Date
    const groups: { [key: string]: CareSession[] } = {};
    filtered.forEach((session) => {
      if (!groups[session.date]) groups[session.date] = [];
      groups[session.date].push(session);
    });

    return Object.keys(groups).map((date) => ({
      title: new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      data: groups[date],
    }));
  }, [sessions, activeFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      completed: sessions.filter((s) => s.status === "Completed").length,
      upcoming: sessions.filter((s) => s.status === "Upcoming").length,
      totalEarned: sessions
        .filter((s) => s.status === "Completed")
        .reduce((sum, s) => sum + s.payout, 0),
    };
  }, [sessions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={["#0d5c63", "#1fb299"]}
        style={styles.headerGradient}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Session History</Text>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.widgetsScroll}
        >
          <View style={styles.widgetCard}>
            <Text style={styles.widgetLabel}>Completed</Text>
            <Text style={styles.widgetValue}>{stats.completed}</Text>
          </View>
          <View style={styles.widgetCard}>
            <Text style={styles.widgetLabel}>Up Next</Text>
            <Text style={styles.widgetValue}>{stats.upcoming}</Text>
          </View>
          <View style={[styles.widgetCard, styles.widgetCardHighlight]}>
            <Text style={[styles.widgetLabel, { color: "#e6f8f5" }]}>
              Total Payouts
            </Text>
            <Text style={[styles.widgetValue, { color: "#fff" }]}>
              {formatCurrency(stats.totalEarned)}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["All", "Upcoming", "Completed", "Cancelled"].map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                onPress={() => setFilter(tab as any)}
              >
                <Text
                  style={[styles.tabText, isActive && styles.tabTextActive]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search & Analytics */}
      <View style={styles.subHeaderSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Image source={icons.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search elders or care types..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterMenuBtn}
            onPress={() => setShowSortModal(true)}
          >
            <Image source={icons.list} style={styles.filterMenuIcon} />
          </TouchableOpacity>
        </View>

        {activeFilter === "All" && !searchQuery && <AnalyticsCard />}
      </View>
    </View>
  );

  const renderSessionCard = ({ item }: { item: CareSession }) => {
    let statusColor = "#1fb299"; // Completed
    let statusBg = "#e6f8f5";
    if (item.status === "Upcoming") {
      statusColor = "#0284c7"; // Blue
      statusBg = "#e0f2fe";
    } else if (item.status === "Cancelled") {
      statusColor = "#ef4444"; // Red
      statusBg = "#fee2e2";
    }

    return (
      <Animated.View
        entering={FadeInDown.duration(400)}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          style={styles.sessionCard}
          onPress={() => setSelectedSession(item)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.elderInfo}>
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
              <View>
                <Text style={styles.elderName}>{item.elderName}</Text>
                <Text style={styles.careType}>{item.careType}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.timelineRow}>
            <View style={styles.timeBlock}>
              <Text style={styles.timeText}>{item.startTime}</Text>
              <View style={styles.timeConnector} />
              <Text style={styles.timeText}>{item.endTime}</Text>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.detailRow}>
                <Image source={icons.point} style={styles.detailIcon} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Image source={icons.dollar} style={styles.detailIcon} />
                <Text style={styles.detailTextPayout}>
                  {formatCurrency(item.payout)} •{" "}
                  <Text style={{ color: "#888" }}>{item.duration}</Text>
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SectionList
        sections={groupedSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSessionCard}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#1fb299"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Sessions Found</Text>
            <Text style={styles.emptyText}>
              Adjust your filters or search query.
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal visible={!!selectedSession} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSession && (
              <>
                <View style={styles.modalHandle} />
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Image
                      source={{ uri: selectedSession.avatarUrl }}
                      style={styles.modalAvatar}
                    />
                    <Text style={styles.modalTitle}>
                      {selectedSession.elderName}
                    </Text>
                    <Text style={styles.modalSub}>
                      {selectedSession.careType}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>Date & Time</Text>
                    <Text style={styles.modalText}>
                      {selectedSession.date} • {selectedSession.startTime} -{" "}
                      {selectedSession.endTime} ({selectedSession.duration})
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>Payout Breakdown</Text>
                    <Text
                      style={[
                        styles.modalText,
                        { color: "#1fb299", fontWeight: "bold", fontSize: 18 },
                      ]}
                    >
                      {formatCurrency(selectedSession.payout)}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>Location</Text>
                    <Text style={styles.modalText}>
                      {selectedSession.location}
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>Session Notes</Text>
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>
                        {selectedSession.notes}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.closeBtn}
                      onPress={() => setSelectedSession(null)}
                    >
                      <Text style={styles.closeBtnText}>Close Details</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  widgetsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  widgetCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    width: 130,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  widgetCardHighlight: {
    backgroundColor: "#0d5c63",
  },
  widgetLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  tabsContainer: {
    marginTop: -20,
    paddingLeft: 20,
    marginBottom: 15,
  },
  tabBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabBtnActive: {
    backgroundColor: "#1fb299",
    borderColor: "#1fb299",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  subHeaderSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    borderRadius: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: "#888",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  filterMenuBtn: {
    width: 50,
    height: 50,
    backgroundColor: "#e6f8f5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterMenuIcon: {
    width: 20,
    height: 20,
    tintColor: "#1fb299",
  },
  analyticsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  analyticsRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e6e6e6",
    marginHorizontal: 15,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0d5c63",
  },
  statValueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
  },
  sessionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  elderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  elderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  careType: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  timelineRow: {
    flexDirection: "row",
  },
  timeBlock: {
    alignItems: "center",
    marginRight: 15,
    width: 60,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  timeConnector: {
    width: 2,
    height: 20,
    backgroundColor: "#e6e6e6",
    marginVertical: 4,
  },
  cardDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    width: 14,
    height: 14,
    tintColor: "#888",
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
  },
  detailTextPayout: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    height: "80%",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e6e6e6",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  modalSub: {
    fontSize: 15,
    color: "#1fb299",
    fontWeight: "600",
    marginTop: 4,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  notesBox: {
    backgroundColor: "#f9fbfd",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    fontStyle: "italic",
  },
  modalActions: {
    marginTop: 10,
    marginBottom: 30,
  },
  closeBtn: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
});
