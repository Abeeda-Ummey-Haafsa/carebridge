import React, { useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { icons } from "@/constants";
import {
  selectCompletedSpending,
  selectSessionCountSummary,
  SessionFilter,
  SessionSortOption,
  useRelativeSessionsStore,
} from "@/store/relativeSessionsStore";

import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "./theme";
import { RelativeActiveSessionCard } from "./components/RelativeActiveSessionCard";
import { RelativeFilterTabs } from "./components/RelativeFilterTabs";
import { RelativeReviewCard } from "./components/RelativeReviewCard";
import {
  RelativeSearchModal,
  RelativeSortModal,
} from "./components/RelativeSessionModals";
import { RelativeSessionCard } from "./components/RelativeSessionCard";
import { RelativeSessionDetailsModal } from "./components/RelativeSessionDetailsModal";
import {
  RelativeSessionsEmptyState,
  RelativeSessionsLoadingState,
} from "./components/RelativeSessionsLoading";
import { RelativeSessionsHeader } from "./components/RelativeSessionsHeader";
import { RelativeSpendingWidget } from "./components/RelativeSpendingWidget";

type TimelineItem =
  | { id: string; type: "category"; label: string }
  | { id: string; type: "date"; label: string }
  | { id: string; type: "session"; sessionId: string };

const HEADER_HEIGHT = 230;
const FILTER_HEIGHT = 58;

const statusTitleMap = {
  Active: "Active Sessions",
  Upcoming: "Upcoming Sessions",
  Completed: "Completed Sessions",
  Cancelled: "Cancelled Sessions",
} as const;

const categoryOrder = ["Active", "Upcoming", "Completed", "Cancelled"] as const;

export default function RelativeSessionHistoryScreen() {
  const router = useRouter();
  const scrollY = useSharedValue(0);

  const {
    sessions,
    activeFilter,
    searchQuery,
    sortBy,
    selectedSession,
    expandedSessionIds,
    page,
    pageSize,
    hasMore,
    isLoading,
    isRefreshing,
    spendingTrend,
    totalSpentThisMonth,
    setFilter,
    setSearchQuery,
    setSortBy,
    setSelectedSession,
    toggleSessionExpanded,
    setPage,
    setHasMore,
    setRefreshing,
  } = useRelativeSessionsStore();

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const counts = useMemo(() => selectSessionCountSummary(sessions), [sessions]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.status === "Active") ?? null,
    [sessions],
  );

  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (activeFilter !== "All") {
      filtered = filtered.filter((session) => session.status === activeFilter);
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      filtered = filtered.filter((session) => {
        const searchable = [
          session.caregiverName,
          session.elderName,
          session.careType,
          session.date,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(normalizedQuery);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();

      if (sortBy === "newest") return dateDiff;
      if (sortBy === "oldest") return -dateDiff;
      if (sortBy === "highest-payment") return b.cost - a.cost;
      if (sortBy === "upcoming-first") {
        const rank = {
          Upcoming: 0,
          Active: 1,
          Completed: 2,
          Cancelled: 3,
        } as const;
        return rank[a.status] - rank[b.status] || dateDiff;
      }
      if (sortBy === "active-first") {
        const rank = {
          Active: 0,
          Upcoming: 1,
          Completed: 2,
          Cancelled: 3,
        } as const;
        return rank[a.status] - rank[b.status] || dateDiff;
      }
      return dateDiff;
    });

    return sorted;
  }, [sessions, activeFilter, searchQuery, sortBy]);

  const visibleSessions = useMemo(() => {
    const result = filteredSessions.slice(0, page * pageSize);
    const stillHasMore = filteredSessions.length > result.length;

    if (stillHasMore !== hasMore) {
      setHasMore(stillHasMore);
    }

    return result;
  }, [filteredSessions, hasMore, page, pageSize, setHasMore]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    categoryOrder.forEach((status) => {
      const scoped = visibleSessions.filter(
        (session) => session.status === status,
      );
      if (!scoped.length) return;

      items.push({
        id: `category-${status}`,
        type: "category",
        label: statusTitleMap[status],
      });

      const dateGroups = scoped.reduce<Record<string, typeof scoped>>(
        (acc, session) => {
          const key = session.date;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(session);
          return acc;
        },
        {},
      );

      Object.keys(dateGroups)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .forEach((date) => {
          const prettyDate = new Date(date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          items.push({
            id: `date-${status}-${date}`,
            type: "date",
            label: prettyDate,
          });

          dateGroups[date].forEach((session) => {
            items.push({
              id: `session-${session.id}`,
              type: "session",
              sessionId: session.id,
            });
          });
        });
    });

    return items;
  }, [visibleSessions]);

  const totalCompletedPayments = useMemo(
    () => selectCompletedSpending(sessions),
    [sessions],
  );

  const activeBookingCosts = useMemo(
    () =>
      sessions
        .filter(
          (session) =>
            session.status === "Active" || session.status === "Upcoming",
        )
        .reduce((sum, session) => sum + session.cost, 0),
    [sessions],
  );

  const averageSessionCost = useMemo(() => {
    if (!sessions.length) return 0;
    return (
      sessions.reduce((sum, session) => sum + session.cost, 0) / sessions.length
    );
  }, [sessions]);

  const recentCompleted = useMemo(
    () =>
      sessions.find((session) => session.status === "Completed") ?? sessions[0],
    [sessions],
  );

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 160],
          [0, -40],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const headerOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 130],
      [1, 0.95],
      Extrapolation.CLAMP,
    ),
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setPage(1);
    }, 900);
  };

  const onLoadMore = () => {
    if (!hasMore || isLoading) {
      return;
    }
    setPage(page + 1);
  };

  const renderTimelineItem = ({ item }: { item: TimelineItem }) => {
    if (item.type === "category") {
      return (
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{item.label}</Text>
        </View>
      );
    }

    if (item.type === "date") {
      return (
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{item.label}</Text>
        </View>
      );
    }

    const session = visibleSessions.find(
      (entry) => entry.id === item.sessionId,
    );
    if (!session) return null;

    return (
      <RelativeSessionCard
        session={session}
        isExpanded={expandedSessionIds.includes(session.id)}
        onToggleExpand={() => toggleSessionExpanded(session.id)}
        onOpenDetails={() => setSelectedSession(session)}
        onOpenChat={() => router.push("/(root)/relative/chat")}
        onRebook={() =>
          Alert.alert("Rebook", `Rebook ${session.caregiverName}`)
        }
        onLeaveReview={() =>
          Alert.alert("Review", `Leave a review for ${session.caregiverName}`)
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.View
        style={[styles.headerLayer, headerAnimatedStyle, headerOverlayStyle]}
      >
        <RelativeSessionsHeader
          totalSessions={counts.all}
          activeSessions={counts.active}
          upcomingSessions={counts.upcoming}
          completedSessions={counts.completed}
          cancelledSessions={counts.cancelled}
          notificationsCount={3}
          onOpenSearch={() => setSearchModalVisible(true)}
          onOpenSort={() => setSortModalVisible(true)}
        />
      </Animated.View>

      <View style={styles.tabsLayer}>
        <RelativeFilterTabs
          activeFilter={activeFilter as SessionFilter}
          onFilterChange={(filter) => {
            setFilter(filter);
            setPage(1);
          }}
          counts={counts}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingPad}>
          <RelativeSessionsLoadingState />
        </View>
      ) : (
        <Animated.FlatList
          data={timelineItems}
          keyExtractor={(item) => item.id}
          renderItem={renderTimelineItem}
          onScroll={scrollHandler}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View>
              {!!activeSession && (
                <RelativeActiveSessionCard
                  session={activeSession}
                  onViewLive={() =>
                    Alert.alert(
                      "Live Session",
                      "Open live timeline and map view.",
                    )
                  }
                  onOpenChat={() => router.push("/(root)/relative/chat")}
                  onEmergency={() =>
                    Alert.alert(
                      "Emergency",
                      "Opening emergency contact workflow.",
                    )
                  }
                  onViewUpdates={() => setSelectedSession(activeSession)}
                />
              )}

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search caregiver, elder, care type, date"
                    placeholderTextColor={RELATIVE_COLORS.soft}
                    style={styles.searchInput}
                  />
                </View>
                <TouchableOpacity
                  style={styles.searchAction}
                  onPress={() => setSortModalVisible(true)}
                >
                  <Text style={styles.searchActionText}>Sort</Text>
                </TouchableOpacity>
              </View>

              {!searchQuery && activeFilter === "All" && (
                <>
                  <RelativeSpendingWidget
                    totalSpent={totalSpentThisMonth}
                    activeBookingCosts={activeBookingCosts}
                    completedPayments={totalCompletedPayments}
                    averageSessionCost={averageSessionCost}
                    weeklyTrend={spendingTrend}
                  />

                  {!!recentCompleted && (
                    <RelativeReviewCard
                      caregiverName={recentCompleted.caregiverName}
                      rating={recentCompleted.caregiverRating ?? 4.8}
                      onLeaveReview={() =>
                        Alert.alert("Review", "Open caregiver review form.")
                      }
                      onRebook={() =>
                        Alert.alert("Rebook", "Open quick rebook flow.")
                      }
                    />
                  )}
                </>
              )}
            </View>
          }
          ListEmptyComponent={
            <RelativeSessionsEmptyState
              filterType={activeFilter}
              onResetFilter={() => {
                setFilter("All");
                setSearchQuery("");
                setPage(1);
              }}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={RELATIVE_COLORS.teal}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <RelativeSortModal
        visible={sortModalVisible}
        currentSort={sortBy as SessionSortOption}
        onClose={() => setSortModalVisible(false)}
        onSortChange={(sort) => {
          setSortBy(sort);
          setPage(1);
        }}
      />

      <RelativeSearchModal
        visible={searchModalVisible}
        initialValue={searchQuery}
        onClose={() => setSearchModalVisible(false)}
        onSearch={(query) => {
          setSearchQuery(query);
          setPage(1);
        }}
      />

      <RelativeSessionDetailsModal
        visible={!!selectedSession}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onChat={() => router.push("/(root)/relative/chat")}
        onRebook={() =>
          Alert.alert("Rebook", "Rebook this caregiver for a new session.")
        }
        onLeaveReview={() =>
          Alert.alert("Review", "Open review and rating form.")
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.screen,
  },
  headerLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  tabsLayer: {
    position: "absolute",
    top: HEADER_HEIGHT,
    left: 0,
    right: 0,
    zIndex: 19,
  },
  listContent: {
    paddingTop: HEADER_HEIGHT + FILTER_HEIGHT + 8,
    paddingBottom: 38,
  },
  loadingPad: {
    paddingTop: HEADER_HEIGHT + FILTER_HEIGHT + 8,
  },
  searchRow: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    paddingHorizontal: 12,
  },
  searchInput: {
    height: 46,
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },
  searchAction: {
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchActionText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "800",
  },
  categoryRow: {
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
  },
  categoryText: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  dateRow: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 8,
    paddingBottom: 8,
  },
  dateText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
