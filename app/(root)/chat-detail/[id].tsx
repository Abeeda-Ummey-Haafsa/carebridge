import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatStore, Message } from "@/store/chatStore";
import { icons } from "@/constants";

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { conversations, sendMessage, markAsRead } = useChatStore();

  const conversation = conversations.find((c) => c.id === id);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) markAsRead(id);
  }, [id, markAsRead]);

  // Use a minimal fallback if invalid conversation
  if (!conversation)
    return (
      <View style={styles.container}>
        <Text>Chat not found</Text>
      </View>
    );

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(conversation.id, inputText.trim());
    setInputText("");
    // Scroll to bottom logically happens automatically with inverted FlatList
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
          <Text style={styles.systemMessageTime}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    }

    const isMe = item.senderId === "me";

    return (
      <View
        style={[
          styles.messageWrapper,
          isMe ? styles.messageWrapperMe : styles.messageWrapperOther,
        ]}
      >
        {!isMe && (
          <Image
            source={{
              uri: "https://xsgames.co/randomusers/avatar.php?g=pixel",
            }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageInfo}>
            <Text
              style={[
                styles.messageTime,
                isMe ? styles.messageTimeMe : styles.messageTimeOther,
              ]}
            >
              {new Date(item.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {isMe && (
              <Image
                source={
                  item.status === "read" ? icons.checkmark : icons.checkmark
                }
                style={[
                  styles.statusIcon,
                  { tintColor: item.status === "read" ? "#4ade80" : "#d1d5db" },
                ]}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Keep latest messages at the bottom efficiently using inverted
  const reversedMessages = [...conversation.messages].reverse();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Image source={icons.backArrow} style={styles.backIcon} />
        </TouchableOpacity>

        <Image
          source={{ uri: "https://xsgames.co/randomusers/avatar.php?g=pixel" }}
          style={styles.headerAvatar}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{conversation.relativeName}</Text>
          <Text style={styles.headerSession}>
            {conversation.isActiveSession
              ? "Active Session"
              : conversation.sessionType}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={icons.call} style={styles.headerIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.composerContainer}>
          <TouchableOpacity style={styles.composerAttach}>
            <Text style={styles.attachText}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.composerInput}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : {},
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Image
              source={icons.arrowUp}
              style={[
                styles.sendIcon,
                { tintColor: inputText.trim() ? "#fff" : "#888" },
              ]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "#333",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  headerSession: {
    fontSize: 12,
    color: "#1fb299",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#e6f8f5",
    borderRadius: 20,
  },
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: "#1fb299",
  },
  messageListContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  systemMessageText: {
    backgroundColor: "#e6e6e6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    color: "#666",
    overflow: "hidden",
  },
  systemMessageTime: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 4,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  messageWrapperMe: {
    justifyContent: "flex-end",
  },
  messageWrapperOther: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: "#1fb299",
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: "#fff",
  },
  messageTextOther: {
    color: "#333",
  },
  messageInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeMe: {
    color: "rgba(255,255,255,0.7)",
  },
  messageTimeOther: {
    color: "#aaa",
  },
  statusIcon: {
    width: 12,
    height: 12,
  },
  composerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  composerAttach: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e6e6e6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  attachText: {
    fontSize: 20,
    color: "#666",
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#f9fbfd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 15,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6e6e6",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonActive: {
    backgroundColor: "#0d5c63",
  },
  sendIcon: {
    width: 20,
    height: 20,
  },
});
