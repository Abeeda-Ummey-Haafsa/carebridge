/**
 * Relative Chat Types
 * TypeScript interfaces for relative messaging system
 */

export type SessionStatus =
  | "active-session"
  | "caregiver-en-route"
  | "scheduled"
  | "completed";

export type CareSessionType =
  | "companionship"
  | "personal-care"
  | "medication-management"
  | "mobility-assistance"
  | "meal-preparation"
  | "household-management"
  | "emergency";

export type MessageType = "text" | "system" | "care-update";

export type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

// Message Interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // "relative" | "caregiver" | "system"
  senderName: string;
  senderAvatar?: string;
  messageType: MessageType;
  content: string;
  timestamp: number;
  deliveryStatus: DeliveryStatus;
  isRead: boolean;
  reactionCount?: number;
}

// Caregiver Profile
export interface CaregiverProfile {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: number;
  specializations?: CareSessionType[];
  rating?: number;
}

// Elder Profile (for context)
export interface ElderProfile {
  id: string;
  name: string;
  avatar?: string;
  relationshipToRelative: string;
}

// Care Session
export interface CareSession {
  id: string;
  elderId: string;
  caregiverId: string;
  sessionType: CareSessionType;
  status: SessionStatus;
  startTime: number;
  endTime?: number;
  notes?: string;
  location?: string;
}

// Conversation (Chat Thread)
export interface Conversation {
  id: string;
  caregiverId: string;
  caregiver: CaregiverProfile;
  elderId: string;
  elder: ElderProfile;
  relativeId: string;
  sessionId: string;
  session?: CareSession;
  lastMessage?: Message;
  lastMessageTime?: string;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: number;
  updatedAt: number;
  isTyping?: boolean;
}

// Chat State
export interface RelativeChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeMessages: Message[];
  searchQuery: string;
  selectedFilter: "all" | "active" | "unread" | "archived";
  isLoading: boolean;
  isLoadingMessages: boolean;
  draftMessage: string;
  typingIndicator: { [key: string]: boolean };
  onlineStatuses: { [key: string]: boolean };

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversationId: string | null) => void;
  setActiveMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: "all" | "active" | "unread" | "archived") => void;
  setIsLoading: (loading: boolean) => void;
  setIsLoadingMessages: (loading: boolean) => void;
  setDraftMessage: (message: string) => void;
  setTypingIndicator: (conversationId: string, isTyping: boolean) => void;
  setOnlineStatus: (caregiverId: string, isOnline: boolean) => void;
  markAsRead: (conversationId: string, messageIds: string[]) => void;
  archiveConversation: (conversationId: string) => void;
  unarchiveConversation: (conversationId: string) => void;
  muteConversation: (conversationId: string) => void;
  unmuteConversation: (conversationId: string) => void;
  clearUnreadCount: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;

  // Selectors
  getFilteredConversations: () => Conversation[];
  getConversationById: (conversationId: string) => Conversation | undefined;
  getUnreadTotalCount: () => number;
  getActiveSessionConversations: () => Conversation[];
}

// UI Component Props
export interface ConversationCardProps {
  conversation: Conversation;
  isSelected?: boolean;
  onPress: () => void;
}

export interface ChatHeaderProps {
  caregiver: CaregiverProfile;
  elder: ElderProfile;
  session?: CareSession;
  isTyping?: boolean;
  onBackPress: () => void;
  onVideoCallPress?: () => void;
  onVoiceCallPress?: () => void;
}

export interface MessageBubbleProps {
  message: Message;
  isFromCurrentUser: boolean;
  previousMessage?: Message;
  nextMessage?: Message;
}

export interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}
