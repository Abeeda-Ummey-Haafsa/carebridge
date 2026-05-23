/**
 * MessageComposer Component
 * Floating message input with send button
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const MessageComposer = ({
  value,
  onChangeText,
  onSend,
  isLoading = false,
  disabled = false,
  style,
}: MessageComposerProps) => {
  const inputHeightRef = useRef(0);
  const [inputHeight, setInputHeight] = React.useState(40);

  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleSend = () => {
    if (value.trim() && !isLoading && !disabled) {
      // Animate send button
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSend();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, style]}
    >
      <View style={styles.composerWrapper}>
        <View style={styles.inputContainer}>
          {/* Attachment Button Placeholder */}
          <TouchableOpacity
            style={styles.iconButton}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle-outline" size={24} color="#1fb299" />
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={[styles.input, { height: Math.max(40, inputHeight) }]}
            placeholder="Type your message..."
            placeholderTextColor="#aaa"
            value={value}
            onChangeText={onChangeText}
            onContentSizeChange={(e) => {
              setInputHeight(e.nativeEvent.contentSize.height);
            }}
            editable={!disabled}
            multiline
            maxHeight={120}
          />

          {/* Emoji Button Placeholder */}
          <TouchableOpacity
            style={styles.iconButton}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="happy-outline" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Send Button */}
        <Animated.View
          style={[
            styles.sendButtonContainer,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLoading ? "hourglass" : "send"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Character Count (Optional) */}
      {value.length > 0 && (
        <Text style={styles.charCount}>
          {value.length} character{value.length !== 1 ? "s" : ""}
        </Text>
      )}
    </KeyboardAvoidingView>
  );
};

import { Text } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  composerWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fbfd",
    borderRadius: 24,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    maxHeight: 120,
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1fb299",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1fb299",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  charCount: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
    alignSelf: "flex-end",
  },
});
