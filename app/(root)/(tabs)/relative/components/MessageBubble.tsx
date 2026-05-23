/**
 * MessageBubble Component
 * Individual message display with animations
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Message } from "@/types/relative-chat";

interface MessageBubbleProps {
  message: Message;
  isFromCurrentUser: boolean;
  style?: ViewStyle;
}

const DeliveryStatus = ({
  status,
}: {
  status: "sending" | "sent" | "delivered" | "read";
}) => {
  const colors = {
    sending: "#999",
    sent: "#888",
    delivered: "#666",
    read: "#1fb299",
  };

  const icons = {
    sending: "time",
    sent: "checkmark",
    delivered: "checkmark-done",
    read: "checkmark-done",
  };

  return (
    <Ionicons
      name={icons[status] as any}
      size={12}
      color={colors[status]}
      style={{ marginLeft: 4 }}
    />
  );
};

export const MessageBubble = ({
  message,
  isFromCurrentUser,
  style,
}: MessageBubbleProps) => {
  const scaleAnimation = useSharedValue(0);

  useEffect(() => {
    scaleAnimation.value = withSpring(1, {
      damping: 10,
      mass: 1,
      stiffness: 100,
    });
  }, [scaleAnimation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnimation.value }],
    };
  });

  const bubbleStyle = isFromCurrentUser
    ? styles.bubbleFromUser
    : styles.bubbleFromCaregiver;

  const textStyle = isFromCurrentUser
    ? styles.textFromUser
    : styles.textFromCaregiver;

  return (
    <Animated.View
      style={[
        styles.messageContainer,
        isFromCurrentUser && styles.messageContainerRight,
        animatedStyle,
        style,
      ]}
    >
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={[styles.text, textStyle]}>{message.content}</Text>
        {isFromCurrentUser && (
          <View style={styles.deliveryContainer}>
            <DeliveryStatus status={message.deliveryStatus} />
          </View>
        )}
      </View>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 12,
    marginHorizontal: 16,
    alignItems: "flex-start",
  },
  messageContainerRight: {
    alignItems: "flex-end",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bubbleFromCaregiver: {
    backgroundColor: "#f0f0f0",
  },
  bubbleFromUser: {
    backgroundColor: "#1fb299",
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textFromCaregiver: {
    color: "#333",
  },
  textFromUser: {
    color: "#fff",
  },
  deliveryContainer: {
    marginTop: 6,
    alignItems: "flex-end",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    marginHorizontal: 4,
  },
});
