/\*\*

- Relative Chat System - Integration Guide & Examples
-
- This file demonstrates how to use the relative chat system
- throughout the CareBridge application.
  \*/

// ============================================
// BASIC SETUP
// ============================================

// 1. Initialize the store in your app root
import { initializeRelativeChatStore } from "@/store/relativeChatStore";
import { useEffect } from "react";

export function AppInitializer() {
useEffect(() => {
// Initialize mock data on app launch
initializeRelativeChatStore();
}, []);

return null;
}

// ============================================
// CONVERSATION LIST USAGE
// ============================================

import { useRelativeChatStore } from "@/store/relativeChatStore";
import { useConversationFilters } from "@/app/(root)/(tabs)/relative/hooks";

// Example: Display all conversations
export function ConversationListExample() {
const { getFilteredConversations } = useRelativeChatStore();

const conversations = getFilteredConversations();

return conversations.map((conv) => (
<ConversationCard
key={conv.id}
conversation={conv}
onPress={() => handleOpenChat(conv.id)}
/>
));
}

// Example: Search and filter conversations
export function FilteredConversationListExample() {
const { setSearchQuery, setSelectedFilter } = useRelativeChatStore();
const { searchQuery, activeFilter } = useConversationFilters();

// Search for conversations
const handleSearch = (text: string) => {
setSearchQuery(text);
// Store automatically filters conversations
};

// Filter by status
const handleFilterChange = (filter: "all" | "active" | "unread" | "archived") => {
setSelectedFilter(filter);
};

return (
<>
<SearchBar value={searchQuery} onChangeText={handleSearch} />
<FilterTabs activeTab={activeFilter} onTabChange={handleFilterChange} />
</>
);
}

// ============================================
// SENDING MESSAGES
// ============================================

import { useMessageComposer } from "@/app/(root)/(tabs)/relative/hooks";

export function MessageComposerExample({ conversationId }: { conversationId: string }) {
const { message, updateMessage, submit, isDraft, isLoading } = useMessageComposer(conversationId);

return (
<MessageComposer
      value={message}
      onChangeText={updateMessage}
      onSend={submit}
      isLoading={isLoading}
      disabled={isLoading}
    />
);
}

// Example: Manual message sending with custom logic
export function CustomMessageSendingExample() {
const { sendMessage } = useRelativeChatStore();

const handleSendWithValidation = async (conversationId: string, text: string) => {
if (!text.trim()) {
alert("Message cannot be empty");
return;
}

    if (text.length > 1000) {
      alert("Message is too long");
      return;
    }

    try {
      await sendMessage(conversationId, text);
      console.log("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
    }

};

return null;
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

import { useConversationState } from "@/app/(root)/(tabs)/relative/hooks";

export function ConversationManagementExample({ conversationId }: { conversationId: string }) {
const {
conversation,
isOnline,
isTyping,
setTyping,
archive,
mute,
unmute,
} = useConversationState(conversationId);

const handleArchive = () => {
archive();
// Navigate back or show confirmation
};

const handleMute = () => {
if (conversation?.isMuted) {
unmute();
} else {
mute();
}
};

// Simulate caregiver typing
const handleCaregiverTyping = () => {
setTyping(true);
setTimeout(() => setTyping(false), 3000);
};

return {
handleArchive,
handleMute,
isOnline,
isMuted: conversation?.isMuted || false,
isTyping,
};
}

// ============================================
// REAL-TIME FEATURES (FUTURE)
// ============================================

// Example: Setting up real-time updates
export function RealtimeUpdatesExample() {
const { addMessage, setTypingIndicator, setOnlineStatus } = useRelativeChatStore();

// Listen for new messages via WebSocket
const handleWebSocketMessage = (data: any) => {
const message = {
id: data.id,
conversationId: data.conversationId,
senderId: data.senderId,
senderName: data.senderName,
messageType: "text" as const,
content: data.content,
timestamp: data.timestamp,
deliveryStatus: "delivered" as const,
isRead: false,
};

    addMessage(message);

};

// Listen for typing indicators
const handleTypingUpdate = (conversationId: string, isTyping: boolean) => {
setTypingIndicator(conversationId, isTyping);
};

// Listen for presence updates
const handlePresenceUpdate = (caregiverId: string, isOnline: boolean) => {
setOnlineStatus(caregiverId, isOnline);
};

return {
handleWebSocketMessage,
handleTypingUpdate,
handlePresenceUpdate,
};
}

// ============================================
// UNREAD NOTIFICATIONS
// ============================================

export function NotificationBadgeExample() {
const { getUnreadTotalCount, getActiveSessionConversations } = useRelativeChatStore();

const totalUnread = getUnreadTotalCount();
const activeSessions = getActiveSessionConversations();

return {
unreadBadgeCount: totalUnread,
showNotification: totalUnread > 0,
activeSessionCount: activeSessions.length,
};
}

// Example: Unread tracking
export function UnreadTrackingExample() {
const { conversations, markAsRead, clearUnreadCount } = useRelativeChatStore();

const handleOpenConversation = (conversationId: string) => {
// Clear unread count when opening conversation
clearUnreadCount(conversationId);
};

const handleMarkAsRead = (conversationId: string, messageIds: string[]) => {
markAsRead(conversationId, messageIds);
};

const unreadConversations = conversations.filter((c) => c.unreadCount > 0);

return {
handleOpenConversation,
handleMarkAsRead,
unreadCount: unreadConversations.length,
};
}

// ============================================
// CUSTOM HOOKS USAGE
// ============================================

export function CustomHooksExample() {
// useRelativeChat: High-level operations
const {
selectedConversation,
selectConversation,
clearSelection,
sendTextMessage,
unreadCount,
activeSessionCount,
} = useRelativeChat();

// useConversationFilters: Search & filter
const {
activeFilter,
searchQuery,
setFilter,
setSearch,
} = useConversationFilters();

// useMessageComposer: Compose messages
const {
message,
updateMessage,
clearMessage,
submit: sendMessage,
} = useMessageComposer(selectedConversation?.id);

// useConversationState: Conversation state
const {
isOnline,
isTyping,
archive,
mute,
} = useConversationState(selectedConversation?.id || "");

return {
// Conversation operations
selectedConversation,
selectConversation,
clearSelection,

    // Search and filter
    activeFilter,
    searchQuery,
    setFilter,
    setSearch,

    // Messaging
    message,
    updateMessage,
    clearMessage,
    sendMessage,

    // State
    isOnline,
    isTyping,
    archive,
    mute,

    // Counts
    unreadCount,
    activeSessionCount,

};
}

// ============================================
// ERROR HANDLING
// ============================================

export function ErrorHandlingExample() {
const { sendMessage } = useRelativeChatStore();

const handleSendWithErrorHandling = async (
conversationId: string,
content: string
) => {
try {
await sendMessage(conversationId, content);
} catch (error) {
if (error instanceof Error) {
console.error("Send error:", error.message);

        // Show appropriate error UI
        if (error.message.includes("offline")) {
          // Show offline indicator
        } else if (error.message.includes("permission")) {
          // Show permission error
        } else {
          // Show generic error
        }
      }
    }

};

return { handleSendWithErrorHandling };
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

import React, { useMemo } from "react";

export function OptimizedConversationListExample() {
const conversations = useRelativeChatStore((state) =>
state.getFilteredConversations()
);

// Memoize filtered results
const displayConversations = useMemo(() => {
return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
}, [conversations]);

return displayConversations;
}

// Memoized conversation card
export const MemoizedConversationCard = React.memo(ConversationCard);

// ============================================
// TYPE SAFETY
// ============================================

import {
Conversation,
Message,
CareSession,
CaregiverProfile,
ElderProfile,
} from "@/types/relative-chat";

export function TypeSafetyExample(
conversation: Conversation,
message: Message,
session: CareSession
) {
// TypeScript ensures type safety
const caregiverName: string = conversation.caregiver.name;
const messageContent: string = message.content;
const sessionStatus: string = session.status;

return { caregiverName, messageContent, sessionStatus };
}

// ============================================
// TESTING EXAMPLE
// ============================================

export function TestingExample() {
// Mock store for testing
const mockStore = {
conversations: [],
setConversations: (convs: Conversation[]) => {},
sendMessage: async (convId: string, content: string) => {},
getFilteredConversations: () => [] as Conversation[],
getUnreadTotalCount: () => 0,
};

// Test conversation filtering
const testFilterLogic = () => {
const conversations: Conversation[] = [
// ... mock data
];

    const filtered = conversations.filter((c) => !c.isArchived);
    expect(filtered.length).toBe(0); // Example assertion

};

return { mockStore, testFilterLogic };
}

// ============================================
// MIGRATION FROM CAREGIVER CHAT
// ============================================

export function MigrationGuide() {
// The relative chat system mirrors the caregiver chat design
// Both use similar component structures:

// Caregiver Chat:
// - app/(root)/(tabs)/caregiver/chat.tsx
// - Components for conversation list

// Relative Chat:
// - app/(root)/(tabs)/relative/chat.tsx
// - Same components, consistent styling

// Shared patterns:
// - Zustand for state management
// - React Native Reanimated for animations
// - Custom hooks for business logic
// - TypeScript for type safety

return {
similarArchitecture: true,
consistentDesign: true,
parallelImplementation: true,
easyToMaintain: true,
};
}
