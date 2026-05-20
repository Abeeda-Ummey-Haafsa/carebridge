import { create } from "zustand";

export interface Message {
  id: string;
  text: string;
  senderId: string; // 'me' for caregiver
  timestamp: string;
  isRead: boolean;
  status: "sending" | "sent" | "delivered" | "read";
  isSystem?: boolean;
}

export interface Conversation {
  id: string;
  elderName: string;
  relativeName: string;
  sessionType: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isActiveSession: boolean;
  messages: Message[];
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;
  sendMessage: (convId: string, text: string) => void;
  markAsRead: (convId: string) => void;
}

const mockMessages: Message[] = [
  {
    id: "m0",
    text: "Session Started",
    senderId: "system",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: true,
    status: "read",
    isSystem: true,
  },
  {
    id: "m1",
    text: "Hi there! Just checking in on my mother.",
    senderId: "relative1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isRead: true,
    status: "read",
  },
  {
    id: "m2",
    text: "Hello! She is doing great. We just finished breakfast.",
    senderId: "me",
    timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    isRead: true,
    status: "read",
  },
  {
    id: "m3",
    text: "Medication has been given.",
    senderId: "me",
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    isRead: false,
    status: "delivered",
  },
];

const mockConversations: Conversation[] = [
  {
    id: "c1",
    elderName: "Elena Rodriguez",
    relativeName: "Maria Rodriguez",
    sessionType: "Medical Care",
    lastMessage: "Medication has been given.",
    lastMessageTime: "2m ago",
    unreadCount: 0,
    isOnline: true,
    isActiveSession: true,
    messages: mockMessages,
  },
  {
    id: "c2",
    elderName: "Arthur Pendelton",
    relativeName: "James Pendelton",
    sessionType: "Companionship",
    lastMessage: "See you tomorrow at 2 PM.",
    lastMessageTime: "1h ago",
    unreadCount: 2,
    isOnline: false,
    isActiveSession: false,
    messages: [
      {
        id: "m4",
        text: "See you tomorrow at 2 PM.",
        senderId: "relative2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false,
        status: "delivered",
      },
    ],
  },
];

export const useChatStore = create<ChatStore>((set) => ({
  conversations: mockConversations,
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  sendMessage: (convId, text) =>
    set((state) => {
      const newMsg: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text,
        senderId: "me",
        timestamp: new Date().toISOString(),
        isRead: false,
        status: "sent",
      };

      return {
        conversations: state.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: text,
                lastMessageTime: "Just now",
              }
            : c,
        ),
      };
    }),
  markAsRead: (convId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === convId ? { ...c, unreadCount: 0 } : c,
      ),
    })),
}));
