/**
 * ConversationCard Component
 * Reusable conversation card for chat list
 * Mirrors caregiver implementation with identical styling
 */

import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { icons } from "@/constants";
import { Conversation } from "@/types/relative-chat";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const ConversationCard = ({
  conversation,
  isSelected,
  onPress,
  onLongPress,
}: ConversationCardProps) => {
  const sessionStatusColor = useMemo(() => {
    switch (conversation.session?.status) {
      case "active-session":
        return "#1fb299";
      case "scheduled":
        return "#3b82f6";
      case "caregiver-en-route":
        return "#f59e0b";
      case "completed":
        return "#6b7280";
      default:
        return "#9ca3af";
    }
  }, [conversation.session?.status]);

  const sessionStatusLabel = useMemo(() => {
    switch (conversation.session?.status) {
      case "active-session":
        return "Active Session";
      case "scheduled":
        return "Scheduled";
      case "caregiver-en-route":
        return "En Route";
      case "completed":
        return "Completed";
      default:
        return "No Session";
    }
  }, [conversation.session?.status]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        conversation.isMuted && styles.cardMuted,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Avatar Container */}
      <View style={styles.avatarContainer}>
        <Image source={icons.man} style={styles.avatar} />
        {conversation.caregiver.isOnline && <View style={styles.onlineBadge} />}
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Header Row - Caregiver Name & Time */}
        <View style={styles.headerRow}>
          <Text style={styles.caregiverName} numberOfLines={1}>
            {conversation.caregiver.name}
          </Text>
          <Text style={styles.timeText}>{conversation.lastMessageTime}</Text>
        </View>

        {/* Session Type & Elder Name */}
        <View style={styles.sessionInfoRow}>
          <View
            style={[
              styles.sessionBadge,
              { backgroundColor: sessionStatusColor },
            ]}
          >
            <Text style={styles.sessionTypeText}>{sessionStatusLabel}</Text>
          </View>
          <Text style={styles.elderNameText}>
            For: {conversation.elder.name}
          </Text>
        </View>

        {/* Message Preview & Unread Badge */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.messageText,
              conversation.unreadCount > 0 && styles.messageTextUnread,
            ]}
            numberOfLines={1}
          >
            {conversation.lastMessage?.content || "No messages yet"}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#f0faf9",
    borderWidth: 2,
    borderColor: "#1fb299",
  },
  cardMuted: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e6e6e6",
  },
  onlineBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1fb299",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0d5c63",
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
  },
  sessionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  sessionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sessionTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  elderNameText: {
    fontSize: 12,
    color: "#666",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    paddingRight: 10,
  },
  messageTextUnread: {
    fontWeight: "600",
    color: "#0d5c63",
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCount: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});
