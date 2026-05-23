/**
 * CareUpdateCard Component
 * Highlighted care update cards embedded in message thread
 */

import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type CareUpdateType =
  | "medication"
  | "meal"
  | "checked-in"
  | "resting"
  | "blood-pressure"
  | "activity";

interface CareUpdateCardProps {
  title: string;
  details?: string[];
  timestamp: number;
  type?: CareUpdateType;
  style?: ViewStyle;
}

export const CareUpdateCard = ({
  title,
  details,
  timestamp,
  type = "checked-in",
  style,
}: CareUpdateCardProps) => {
  const getIcon = () => {
    switch (type) {
      case "medication":
        return "bandage";
      case "meal":
        return "restaurant";
      case "blood-pressure":
        return "heart";
      case "resting":
        return "bed";
      case "activity":
        return "walk";
      default:
        return "checkmark-circle";
    }
  };

  const getColor = () => {
    switch (type) {
      case "medication":
        return "#ef4444";
      case "meal":
        return "#f97316";
      case "blood-pressure":
        return "#ec4899";
      case "resting":
        return "#3b82f6";
      case "activity":
        return "#10b981";
      default:
        return "#1fb299";
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: color + "20" }]}>
            <Ionicons name={getIcon() as any} size={20} color={color} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color }]}>{title}</Text>
            <Text style={styles.timestamp}>
              {new Date(timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
        </View>

        {details && details.length > 0 && (
          <View style={styles.detailsContainer}>
            {details.map((detail, index) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailDot}>•</Text>
                <Text style={styles.detailText}>{detail}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  card: {
    backgroundColor: "#f9fbfd",
    borderLeftWidth: 4,
    borderLeftColor: "#1fb299",
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
  },
  detailsContainer: {
    paddingLeft: 56,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailDot: {
    fontSize: 16,
    color: "#1fb299",
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
});
