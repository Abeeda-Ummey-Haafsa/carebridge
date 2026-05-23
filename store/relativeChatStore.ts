/**
 * Relative Chat Store
 * Zustand store for managing relative messaging state
 */

import { create } from "zustand";
import {
  RelativeChatState,
  Conversation,
  Message,
  CareSession,
} from "@/types/relative-chat";
import {
  generateMockConversations,
  generateMockMessages,
} from "./relativeChatMockData";

export const useRelativeChatStore = create<RelativeChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  activeMessages: [],
  searchQuery: "",
  selectedFilter: "all",
  isLoading: false,
  isLoadingMessages: false,
  draftMessage: "",
  typingIndicator: {},
  onlineStatuses: {},

  // Basic setters
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),
  setActiveMessages: (messages) => set({ activeMessages: messages }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setDraftMessage: (message) => set({ draftMessage: message }),

  // Message management
  addMessage: (message) => {
    set((state) => ({
      activeMessages: [...state.activeMessages, message],
    }));

    // Update conversation's last message
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === message.conversationId
          ? {
              ...conv,
              lastMessage: message,
              lastMessageTime: formatTime(message.timestamp),
              updatedAt: message.timestamp,
            }
          : conv,
      ),
    }));
  },

  // Typing indicator
  setTypingIndicator: (conversationId, isTyping) => {
    set((state) => ({
      typingIndicator: {
        ...state.typingIndicator,
        [conversationId]: isTyping,
      },
    }));
  },

  // Online status
  setOnlineStatus: (caregiverId, isOnline) => {
    set((state) => ({
      onlineStatuses: {
        ...state.onlineStatuses,
        [caregiverId]: isOnline,
      },
      conversations: state.conversations.map((conv) =>
        conv.caregiverId === caregiverId
          ? {
              ...conv,
              caregiver: {
                ...conv.caregiver,
                isOnline,
              },
            }
          : conv,
      ),
    }));
  },

  // Mark messages as read
  markAsRead: (conversationId, messageIds) => {
    set((state) => ({
      activeMessages: state.activeMessages.map((msg) =>
        messageIds.includes(msg.id)
          ? { ...msg, isRead: true, deliveryStatus: "read" }
          : msg,
      ),
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    }));
  },

  // Archive conversation
  archiveConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isArchived: true } : conv,
      ),
    }));
  },

  // Unarchive conversation
  unarchiveConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isArchived: false } : conv,
      ),
    }));
  },

  // Mute conversation
  muteConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: true } : conv,
      ),
    }));
  },

  // Unmute conversation
  unmuteConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isMuted: false } : conv,
      ),
    }));
  },

  // Clear unread count
  clearUnreadCount: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
      ),
    }));
  },

  // Send message (placeholder implementation)
  sendMessage: async (conversationId, content) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: "relative",
      senderName: "You",
      messageType: "text",
      content,
      timestamp: Date.now(),
      deliveryStatus: "sending",
      isRead: false,
    };

    get().addMessage(newMessage);
    get().setDraftMessage("");

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update delivery status
    set((state) => ({
      activeMessages: state.activeMessages.map((msg) =>
        msg.id === newMessage.id ? { ...msg, deliveryStatus: "sent" } : msg,
      ),
    }));

    // Simulate caregiver response after 2 seconds
    setTimeout(() => {
      const responseMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        conversationId,
        senderId: "caregiver",
        senderName: "Caregiver",
        messageType: "text",
        content: "Message received! Thank you for reaching out.",
        timestamp: Date.now() + 2000,
        deliveryStatus: "delivered",
        isRead: false,
      };
      get().addMessage(responseMessage);
    }, 2000);
  },

  // Filtered conversations selector
  getFilteredConversations: () => {
    const state = get();
    let filtered = state.conversations.filter((conv) => !conv.isArchived);

    // Apply filter
    if (state.selectedFilter === "active") {
      filtered = filtered.filter(
        (conv) => conv.session?.status === "active-session",
      );
    } else if (state.selectedFilter === "unread") {
      filtered = filtered.filter((conv) => conv.unreadCount > 0);
    } else if (state.selectedFilter === "archived") {
      filtered = state.conversations.filter((conv) => conv.isArchived);
    }

    // Apply search
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.caregiver.name.toLowerCase().includes(query) ||
          conv.elder.name.toLowerCase().includes(query) ||
          conv.session?.sessionType.includes(query.replace(/-/g, " ")),
      );
    }

    return filtered;
  },

  // Get conversation by ID
  getConversationById: (conversationId) => {
    return get().conversations.find((conv) => conv.id === conversationId);
  },

  // Get total unread count
  getUnreadTotalCount: () => {
    return get().conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  },

  // Get active session conversations
  getActiveSessionConversations: () => {
    return get().conversations.filter(
      (conv) => conv.session?.status === "active-session",
    );
  },
}));

// Helper function to format timestamp
export function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Initialize store with mock data
export function initializeRelativeChatStore() {
  const conversations = generateMockConversations();
  useRelativeChatStore.setState({
    conversations,
    onlineStatuses: conversations.reduce(
      (acc, conv) => {
        acc[conv.caregiverId] = conv.caregiver.isOnline;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  });
}
