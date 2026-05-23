/**
 * useRelativeChat Hook
 * Custom hook for relative chat functionality
 */

import { useCallback, useEffect, useState } from "react";
import { useRelativeChatStore } from "@/store/relativeChatStore";
import { Conversation, Message } from "@/types/relative-chat";

export const useRelativeChat = () => {
  const store = useRelativeChatStore();
  const [selectedConversation, setSelectedConversation] = useState<
    Conversation | undefined
  >();

  // Select a conversation and load its messages
  const selectConversation = useCallback(
    (conversationId: string) => {
      const conversation = store.getConversationById(conversationId);
      setSelectedConversation(conversation);
      store.setActiveConversation(conversationId);
      if (conversation) {
        store.clearUnreadCount(conversationId);
      }
    },
    [store],
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedConversation(undefined);
    store.setActiveConversation(null);
  }, [store]);

  // Send a message
  const sendTextMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!content.trim()) return;
      await store.sendMessage(conversationId, content);
    },
    [store],
  );

  return {
    selectedConversation,
    selectConversation,
    clearSelection,
    sendTextMessage,
    conversations: store.conversations,
    filteredConversations: store.getFilteredConversations(),
    unreadCount: store.getUnreadTotalCount(),
    activeSessionCount: store.getActiveSessionConversations().length,
    isLoading: store.isLoading,
  };
};

/**
 * useConversationFilters Hook
 * Manage conversation filtering and searching
 */
export const useConversationFilters = () => {
  const store = useRelativeChatStore();

  const setFilter = useCallback(
    (filter: "all" | "active" | "unread" | "archived") => {
      store.setSelectedFilter(filter);
    },
    [store],
  );

  const setSearch = useCallback(
    (query: string) => {
      store.setSearchQuery(query);
    },
    [store],
  );

  const clearFilters = useCallback(() => {
    store.setSearchQuery("");
    store.setSelectedFilter("all");
  }, [store]);

  return {
    activeFilter: store.selectedFilter,
    searchQuery: store.searchQuery,
    setFilter,
    setSearch,
    clearFilters,
    filtered: store.getFilteredConversations(),
  };
};

/**
 * useMessageComposer Hook
 * Manage message composition state
 */
export const useMessageComposer = (conversationId?: string) => {
  const store = useRelativeChatStore();
  const [isDraft, setIsDraft] = useState(false);

  const updateMessage = useCallback(
    (text: string) => {
      store.setDraftMessage(text);
      setIsDraft(text.trim().length > 0);
    },
    [store],
  );

  const clearMessage = useCallback(() => {
    store.setDraftMessage("");
    setIsDraft(false);
  }, [store]);

  const submit = useCallback(async () => {
    if (conversationId && store.draftMessage.trim()) {
      await store.sendMessage(conversationId, store.draftMessage);
      clearMessage();
    }
  }, [conversationId, store, clearMessage]);

  return {
    message: store.draftMessage,
    updateMessage,
    clearMessage,
    submit,
    isDraft,
    isLoading: store.isLoadingMessages,
  };
};

/**
 * useConversationState Hook
 * Manage individual conversation state (online status, typing, etc.)
 */
export const useConversationState = (conversationId: string) => {
  const store = useRelativeChatStore();
  const conversation = store.getConversationById(conversationId);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      store.setTypingIndicator(conversationId, isTyping);
    },
    [conversationId, store],
  );

  const setOnlineStatus = useCallback(
    (isOnline: boolean) => {
      if (conversation) {
        store.setOnlineStatus(conversation.caregiverId, isOnline);
      }
    },
    [conversation, store],
  );

  const archive = useCallback(() => {
    store.archiveConversation(conversationId);
  }, [conversationId, store]);

  const unarchive = useCallback(() => {
    store.unarchiveConversation(conversationId);
  }, [conversationId, store]);

  const mute = useCallback(() => {
    store.muteConversation(conversationId);
  }, [conversationId, store]);

  const unmute = useCallback(() => {
    store.unmuteConversation(conversationId);
  }, [conversationId, store]);

  return {
    conversation,
    isTyping: store.typingIndicator[conversationId] || false,
    isOnline: conversation?.caregiver.isOnline || false,
    setTyping,
    setOnlineStatus,
    archive,
    unarchive,
    mute,
    unmute,
  };
};
