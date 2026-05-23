/**
 * ChatHeader Component for Detail View
 * Displays caregiver info, session status, and quick actions
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
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";
import {
  CaregiverProfile,
  ElderProfile,
  CareSession,
} from "@/types/relative-chat";

interface ChatHeaderProps {
  caregiver: CaregiverProfile;
  elder: ElderProfile;
  session?: CareSession;
  isTyping?: boolean;
  onBackPress: () => void;
  onVideoCallPress?: () => void;
  onVoiceCallPress?: () => void;
  style?: ViewStyle;
}

export const ChatHeader = ({
  caregiver,
  elder,
  session,
  isTyping,
  onBackPress,
  onVideoCallPress,
  onVoiceCallPress,
  style,
}: ChatHeaderProps) => {
  const sessionStatusColor = useMemo(() => {
    switch (session?.status) {
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
  }, [session?.status]);

  const sessionStatusLabel = useMemo(() => {
    switch (session?.status) {
      case "active-session":
        return "Active Session";
      case "scheduled":
        return "Scheduled";
      case "caregiver-en-route":
        return "En Route";
      case "completed":
        return "Completed";
      default:
        return "No Active Session";
    }
  }, [session?.status]);

  return (
    <View style={[styles.container, style]}>
      {/* Back Button & Profile */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onBackPress} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0d5c63" />
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <Image source={icons.man} style={styles.avatar} />
          <View style={styles.infoSection}>
            <Text style={styles.caregiverName}>{caregiver.name}</Text>
            {isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
              <Text style={styles.statusText}>
                {caregiver.isOnline ? "Online" : "Offline"}
              </Text>
            )}
          </View>
          {caregiver.isOnline && <View style={styles.onlineIndicator} />}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.rightSection}>
        {onVoiceCallPress && (
          <TouchableOpacity onPress={onVoiceCallPress} activeOpacity={0.7}>
            <Ionicons name="call" size={24} color="#1fb299" />
          </TouchableOpacity>
        )}
        {onVideoCallPress && (
          <TouchableOpacity
            onPress={onVideoCallPress}
            style={{ marginLeft: 16 }}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={24} color="#1fb299" />
          </TouchableOpacity>
        )}
      </View>

      {/* Session Info Bar */}
      <View style={styles.sessionBar}>
        <View
          style={[styles.sessionBadge, { backgroundColor: sessionStatusColor }]}
        >
          <Text style={styles.sessionText}>{sessionStatusLabel}</Text>
        </View>
        <Text style={styles.elderText}>{elder.name}</Text>
        {session?.sessionType && (
          <Text style={styles.typeText}>
            • {session.sessionType.replace(/-/g, " ")}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  profileSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6e6e6",
  },
  infoSection: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0d5c63",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  typingText: {
    fontSize: 12,
    color: "#1fb299",
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1fb299",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sessionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  sessionText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
  },
  elderText: {
    fontSize: 12,
    color: "#0d5c63",
    fontWeight: "500",
  },
  typeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});
