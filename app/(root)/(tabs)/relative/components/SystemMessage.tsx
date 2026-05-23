/**
 * SystemMessage Component
 * Display system messages and care updates in timeline style
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SystemMessageProps {
  content: string;
  timestamp: number;
  type?: "session-update" | "care-update" | "alert";
  style?: ViewStyle;
}

export const SystemMessage = ({
  content,
  timestamp,
  type = "session-update",
  style,
}: SystemMessageProps) => {
  const getIcon = () => {
    switch (type) {
      case "care-update":
        return "checkmark-circle";
      case "alert":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const getColor = () => {
    switch (type) {
      case "care-update":
        return "#1fb299";
      case "alert":
        return "#f59e0b";
      default:
        return "#3b82f6";
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.timeline}>
        <View style={[styles.dot, { backgroundColor: getColor() }]} />
        <View style={styles.line} />
      </View>

      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: getColor() + "20" }]}>
          <Ionicons
            name={getIcon() as any}
            size={14}
            color={getColor()}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.text, { color: getColor() }]}>{content}</Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginVertical: 12,
    marginHorizontal: 16,
  },
  timeline: {
    alignItems: "center",
    marginRight: 12,
    width: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1fb299",
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: "#e6e6e6",
    marginTop: 8,
  },
  content: {
    flex: 1,
    marginTop: -2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
});
