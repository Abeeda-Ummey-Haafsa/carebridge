/**
 * Relative Chat Screen
 * Conversation list view for relatives to communicate with caregivers
 * Mirrors caregiver chat design for consistency
 */

import React, { useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useRelativeChatStore,
  initializeRelativeChatStore,
} from "@/store/relativeChatStore";
import { Conversation } from "@/types/relative-chat";
import {
  ChatListHeader,
  SearchBar,
  FilterTabs,
  ConversationCard,
  ConversationSkeleton,
} from "./components";

export default function RelativeChatScreen() {
  const router = useRouter();
  const {
    isLoading,
    searchQuery,
    selectedFilter,
    setSearchQuery,
    setSelectedFilter,
    setIsLoading,
    getFilteredConversations,
  } = useRelativeChatStore();

  const [refreshing, setRefreshing] = React.useState(false);

  // Initialize mock data on mount
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      initializeRelativeChatStore();
      setIsLoading(false);
    }, 300);
  }, [setIsLoading]);

  const filteredConversations = getFilteredConversations();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleConversationPress = (conversationId: string) => {
    router.push({
      pathname: "/chat-detail/[id]",
      params: { id: conversationId },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationCard
      conversation={item}
      onPress={() => handleConversationPress(item.id)}
      onLongPress={() => {
        // Placeholder for swipe actions (mute, archive, etc.)
        console.log("Long press on conversation:", item.id);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <ChatListHeader />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchBar}
      />

      {/* Filter Tabs */}
      <FilterTabs
        activeTab={selectedFilter}
        onTabChange={(tab) => setSelectedFilter(tab)}
      />

      {/* Conversation List */}
      {isLoading ? (
        <ConversationSkeleton count={3} />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1fb299"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {selectedFilter === "archived"
                  ? "No archived conversations."
                  : "No conversations found."}
              </Text>
            </View>
          }
          scrollEnabled={!isLoading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  searchBar: {
    marginTop: 12,
    marginBottom: 0,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "500",
  },
});
