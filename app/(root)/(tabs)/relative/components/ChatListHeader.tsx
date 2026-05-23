/**
 * ChatListHeader Component
 * Header with title and unread summary
 * Consistent with caregiver design
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useRelativeChatStore } from "@/store/relativeChatStore";

interface ChatListHeaderProps {
  style?: ViewStyle;
}

export const ChatListHeader = ({ style }: ChatListHeaderProps) => {
  const totalUnread = useRelativeChatStore((state) =>
    state.getUnreadTotalCount(),
  );
  const activeSessionCount = useRelativeChatStore(
    (state) =>
      state.conversations.filter(
        (conv) => conv.session?.status === "active-session",
      ).length,
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Messages</Text>
        {totalUnread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {activeSessionCount > 0 && (
        <Text style={styles.subtitle}>
          {activeSessionCount} active care session
          {activeSessionCount !== 1 ? "s" : ""}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0d5c63",
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#1fb299",
    fontWeight: "500",
    marginTop: 6,
  },
});
