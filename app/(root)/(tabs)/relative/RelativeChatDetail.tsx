/**
 * RelativeChatDetail Screen
 * Active chat view between relative and caregiver
 */

import React, { useEffect, useMemo } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRelativeChatStore, formatTime } from "@/store/relativeChatStore";
import { generateMockMessages } from "@/store/relativeChatMockData";
import { Message } from "@/types/relative-chat";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "./components/MessageBubble";
import { SystemMessage } from "./components/SystemMessage";
import { MessageComposer } from "./components/MessageComposer";
import { CareUpdateCard } from "./components/CareUpdateCard";

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
    if (activeConversationId) {
      await sendMessage(activeConversationId, draftMessage);
    }
  };

  if (!conversation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1fb299" />
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
    const previousMessage = index > 0 ? activeMessages[index - 1] : undefined;

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
    <SafeAreaView style={styles.container}>
      {/* Chat Header */}
      <ChatHeader
        caregiver={conversation.caregiver}
        elder={conversation.elder}
        session={conversation.session}
        isTyping={conversation.isTyping}
        onBackPress={() => router.back()}
        onVideoCallPress={() => console.log("Video call")}
        onVoiceCallPress={() => console.log("Voice call")}
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
          onEndReachedThreshold={0.5}
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

import { Text } from "react-native";

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
