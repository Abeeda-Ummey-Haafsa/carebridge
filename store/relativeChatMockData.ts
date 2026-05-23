/**
 * Mock Data for Relative Chat
 * Placeholder data for development and testing
 */

import {
  Conversation,
  Message,
  CaregiverProfile,
  ElderProfile,
  CareSession,
  SessionStatus,
  CareSessionType,
} from "@/types/relative-chat";

// Mock caregiver profiles
const mockCaregivers: CaregiverProfile[] = [
  {
    id: "cg_001",
    name: "Emma Wilson",
    isOnline: true,
    lastSeen: Date.now() - 2 * 60000,
    specializations: ["companionship", "personal-care"],
    rating: 4.8,
  },
  {
    id: "cg_002",
    name: "James Rodriguez",
    isOnline: true,
    lastSeen: Date.now() - 5 * 60000,
    specializations: ["mobility-assistance", "personal-care"],
    rating: 4.9,
  },
  {
    id: "cg_003",
    name: "Sarah Chen",
    isOnline: false,
    lastSeen: Date.now() - 1 * 3600000,
    specializations: ["medication-management", "meal-preparation"],
    rating: 4.7,
  },
  {
    id: "cg_004",
    name: "Michael Brown",
    isOnline: true,
    lastSeen: Date.now() - 10 * 60000,
    specializations: ["household-management", "companionship"],
    rating: 4.6,
  },
];

// Mock elder profiles
const mockElders: ElderProfile[] = [
  {
    id: "elder_001",
    name: "Margaret Wilson",
    relationshipToRelative: "Mother",
  },
  {
    id: "elder_002",
    name: "Robert Garcia",
    relationshipToRelative: "Father",
  },
  {
    id: "elder_003",
    name: "Dorothy Johnson",
    relationshipToRelative: "Grandmother",
  },
  {
    id: "elder_004",
    name: "Walter Thompson",
    relationshipToRelative: "Grandfather",
  },
];

// Mock care sessions
const mockSessions: CareSession[] = [
  {
    id: "session_001",
    elderId: "elder_001",
    caregiverId: "cg_001",
    sessionType: "companionship",
    status: "active-session",
    startTime: Date.now() - 30 * 60000,
    notes: "Regular companionship check-in",
  },
  {
    id: "session_002",
    elderId: "elder_002",
    caregiverId: "cg_002",
    sessionType: "personal-care",
    status: "active-session",
    startTime: Date.now() - 15 * 60000,
    endTime: Date.now() + 45 * 60000,
    notes: "Personal care assistance",
  },
  {
    id: "session_003",
    elderId: "elder_003",
    caregiverId: "cg_003",
    sessionType: "medication-management",
    status: "completed",
    startTime: Date.now() - 4 * 3600000,
    endTime: Date.now() - 3 * 3600000,
    notes: "Medication administered and logged",
  },
  {
    id: "session_004",
    elderId: "elder_004",
    caregiverId: "cg_004",
    sessionType: "household-management",
    status: "scheduled",
    startTime: Date.now() + 2 * 3600000,
    notes: "Scheduled for tomorrow afternoon",
  },
];

// Mock messages
const mockMessages: Message[] = [
  {
    id: "msg_001",
    conversationId: "conv_001",
    senderId: "caregiver",
    senderName: "Emma Wilson",
    messageType: "text",
    content: "Hi! I've just arrived and Margaret is doing well today.",
    timestamp: Date.now() - 2 * 60000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_002",
    conversationId: "conv_001",
    senderId: "caregiver",
    senderName: "Emma Wilson",
    messageType: "care-update",
    content: "Medication has been administered as scheduled.",
    timestamp: Date.now() - 1.5 * 60000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_003",
    conversationId: "conv_001",
    senderId: "relative",
    senderName: "You",
    messageType: "text",
    content: "Thank you! That's great to hear. How is her mood today?",
    timestamp: Date.now() - 1 * 60000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_004",
    conversationId: "conv_001",
    senderId: "caregiver",
    senderName: "Emma Wilson",
    messageType: "text",
    content:
      "She's in good spirits. We've been having a nice conversation about her garden.",
    timestamp: Date.now() - 30 * 1000,
    deliveryStatus: "delivered",
    isRead: false,
  },
  {
    id: "msg_005",
    conversationId: "conv_002",
    senderId: "caregiver",
    senderName: "James Rodriguez",
    messageType: "text",
    content: "Starting the mobility assistance session now.",
    timestamp: Date.now() - 20 * 60000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_006",
    conversationId: "conv_002",
    senderId: "relative",
    senderName: "You",
    messageType: "text",
    content: "Perfect, thanks for the update!",
    timestamp: Date.now() - 15 * 60000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_007",
    conversationId: "conv_003",
    senderId: "caregiver",
    senderName: "Sarah Chen",
    messageType: "care-update",
    content: "Medication administered: Lisinopril 5mg, Metformin 500mg",
    timestamp: Date.now() - 4 * 3600000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_008",
    conversationId: "conv_003",
    senderId: "caregiver",
    senderName: "Sarah Chen",
    messageType: "text",
    content: "Session completed. Dorothy is resting well.",
    timestamp: Date.now() - 3.5 * 3600000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_009",
    conversationId: "conv_004",
    senderId: "caregiver",
    senderName: "Michael Brown",
    messageType: "text",
    content: "Looking forward to tomorrow's session! 👋",
    timestamp: Date.now() - 24 * 3600000,
    deliveryStatus: "read",
    isRead: true,
  },
  {
    id: "msg_010",
    conversationId: "conv_001",
    senderId: "relative",
    senderName: "You",
    messageType: "text",
    content: "Wonderful! Let me know if anything changes.",
    timestamp: Date.now() - 25 * 1000,
    deliveryStatus: "sending",
    isRead: false,
  },
];

// Generate mock conversations
export function generateMockConversations(): Conversation[] {
  return [
    {
      id: "conv_001",
      caregiverId: "cg_001",
      caregiver: mockCaregivers[0],
      elderId: "elder_001",
      elder: mockElders[0],
      relativeId: "relative_001",
      sessionId: "session_001",
      session: mockSessions[0],
      lastMessage: mockMessages[3],
      lastMessageTime: "2m ago",
      unreadCount: 1,
      isArchived: false,
      isMuted: false,
      createdAt: Date.now() - 7 * 24 * 3600000,
      updatedAt: Date.now() - 30 * 1000,
      isTyping: false,
    },
    {
      id: "conv_002",
      caregiverId: "cg_002",
      caregiver: mockCaregivers[1],
      elderId: "elder_002",
      elder: mockElders[1],
      relativeId: "relative_001",
      sessionId: "session_002",
      session: mockSessions[1],
      lastMessage: mockMessages[5],
      lastMessageTime: "15m ago",
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      createdAt: Date.now() - 5 * 24 * 3600000,
      updatedAt: Date.now() - 15 * 60000,
      isTyping: false,
    },
    {
      id: "conv_003",
      caregiverId: "cg_003",
      caregiver: mockCaregivers[2],
      elderId: "elder_003",
      elder: mockElders[2],
      relativeId: "relative_001",
      sessionId: "session_003",
      session: mockSessions[2],
      lastMessage: mockMessages[7],
      lastMessageTime: "3h ago",
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      createdAt: Date.now() - 10 * 24 * 3600000,
      updatedAt: Date.now() - 3.5 * 3600000,
      isTyping: false,
    },
    {
      id: "conv_004",
      caregiverId: "cg_004",
      caregiver: mockCaregivers[3],
      elderId: "elder_004",
      elder: mockElders[3],
      relativeId: "relative_001",
      sessionId: "session_004",
      session: mockSessions[3],
      lastMessage: mockMessages[8],
      lastMessageTime: "1d ago",
      unreadCount: 0,
      isArchived: false,
      isMuted: false,
      createdAt: Date.now() - 15 * 24 * 3600000,
      updatedAt: Date.now() - 24 * 3600000,
      isTyping: false,
    },
  ];
}

// Generate mock messages for a conversation
export function generateMockMessages(conversationId: string): Message[] {
  return mockMessages.filter((msg) => msg.conversationId === conversationId);
}

// Get caregiver profile by ID
export function getCaregiverById(id: string): CaregiverProfile | undefined {
  return mockCaregivers.find((cg) => cg.id === id);
}

// Get elder profile by ID
export function getElderById(id: string): ElderProfile | undefined {
  return mockElders.find((elder) => elder.id === id);
}

// Get session by ID
export function getSessionById(id: string): CareSession | undefined {
  return mockSessions.find((session) => session.id === id);
}
