/**
 * Relative Chat Detail Screen
 * Route: app/(root)/(tabs)/relative/chat-detail/[id].tsx
 * Active chat view between relative and caregiver
 */

import React, { useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRelativeChatStore, formatTime } from "@/store/relativeChatStore";
import { generateMockMessages } from "@/store/relativeChatMockData";
import { Message } from "@/types/relative-chat";
import {
  ChatHeader,
  MessageBubble,
  SystemMessage,
  MessageComposer,
  CareUpdateCard,
} from "../components";

export default function RelativeChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    activeConversationId,
    setActiveConversation,
    activeMessages,
    setActiveMessages,
    draftMessage,
    setDraftMessage,
    sendMessage,
    isLoadingMessages,
    getConversationById,
    clearUnreadCount,
  } = useRelativeChatStore();

  // Initialize conversation
  useEffect(() => {
    if (id) {
      setActiveConversation(id);
      const conversation = getConversationById(id);
      if (conversation) {
        // Load mock messages
        const messages = generateMockMessages(id);
        setActiveMessages(messages);
        clearUnreadCount(id);
      }
    }

    return () => {
      // Cleanup on unmount
      setActiveConversation(null);
      setActiveMessages([]);
    };
  }, [
    id,
    setActiveConversation,
    getConversationById,
    setActiveMessages,
    clearUnreadCount,
  ]);

  const conversation = useMemo(
    () => getConversationById(activeConversationId || ""),
    [activeConversationId, getConversationById],
  );

  const handleSendMessage = async () => {
    if (activeConversationId && draftMessage.trim()) {
      await sendMessage(activeConversationId, draftMessage);
    }
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1fb299" />
        </View>
      </SafeAreaView>
    );
  }

  const renderMessageItem = ({
    item,
    index,
  }: {
    item: Message;
    index: number;
  }) => {
    const isFromCurrentUser = item.senderId === "relative";

    // Check if this is a care update to show as a special card
    if (item.messageType === "care-update") {
      return (
        <CareUpdateCard
          title={item.content}
          timestamp={item.timestamp}
          type="medication"
        />
      );
    }

    // Show system messages differently
    if (item.messageType === "system") {
      return (
        <SystemMessage
          content={item.content}
          timestamp={item.timestamp}
          type="session-update"
        />
      );
    }

    return (
      <MessageBubble message={item} isFromCurrentUser={isFromCurrentUser} />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Chat Header */}
      <ChatHeader
        caregiver={conversation.caregiver}
        elder={conversation.elder}
        session={conversation.session}
        isTyping={conversation.isTyping}
        onBackPress={() => router.back()}
        onVideoCallPress={() => {
          // Placeholder for video call
          console.log("Video call initiated");
        }}
        onVoiceCallPress={() => {
          // Placeholder for voice call
          console.log("Voice call initiated");
        }}
      />

      {/* Messages List */}
      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1fb299" />
        </View>
      ) : (
        <FlatList
          data={activeMessages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageListContent}
          scrollEnabled={activeMessages.length > 0}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No messages yet. Start a conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Message Composer */}
      <MessageComposer
        value={draftMessage}
        onChangeText={setDraftMessage}
        onSend={handleSendMessage}
        disabled={!conversation.caregiver.isOnline}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fbfd",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageListContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});
