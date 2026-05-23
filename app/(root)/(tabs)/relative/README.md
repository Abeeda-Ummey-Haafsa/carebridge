# Relative Chat System Documentation

## Overview

The Relative Chat system is a comprehensive messaging interface that allows relatives to communicate with caregivers about care sessions. It mirrors the caregiver chat design for consistency and provides a unified healthcare messenger experience.

## Architecture

### Directory Structure

```
app/(root)/(tabs)/relative/
├── chat.tsx                    # Main chat list screen
├── RelativeChatDetail.tsx      # Active chat conversation view
├── components/
│   ├── index.ts               # Component exports
│   ├── ChatListHeader.tsx      # Header with unread summary
│   ├── SearchBar.tsx           # Search input component
│   ├── FilterTabs.tsx          # Filter tab buttons
│   ├── ConversationCard.tsx    # Individual conversation card
│   ├── ConversationSkeleton.tsx # Loading placeholder
│   ├── ChatHeader.tsx          # Chat detail view header
│   ├── MessageBubble.tsx       # Individual message display
│   ├── SystemMessage.tsx       # System update display
│   ├── MessageComposer.tsx     # Message input & send
│   └── CareUpdateCard.tsx      # Care update cards
├── hooks/
│   ├── index.ts               # Hook exports
│   └── useRelativeChat.ts      # Custom hooks
└── _layout.tsx                # Tab navigation layout
```

## Features

### 1. Conversation List View (chat.tsx)

**Purpose**: Display all conversations between relatives and caregivers

**Features**:

- Pull-to-refresh
- Search by caregiver name, elder name, or session type
- Filter tabs: All, Active, Unread, Archived
- Unread message badges
- Online status indicators
- Session status badges
- Loading skeleton states
- Empty state handling

**Key Props**:

- `conversation`: Conversation object
- `isSelected`: Boolean for selection state
- `onPress`: Callback on card press

### 2. Chat Detail View (RelativeChatDetail.tsx)

**Purpose**: Display active conversation between relative and caregiver

**Features**:

- Sticky chat header with caregiver info
- Message thread with animations
- System messages and care updates
- Real-time typing indicators
- Message delivery status (sending, sent, delivered, read)
- Floating message composer
- Keyboard-aware layout
- Auto-scrolling

### 3. Components

#### ChatListHeader

- Displays "Messages" title
- Shows total unread count badge
- Shows active session count

#### SearchBar

- Real-time conversation search
- Search in caregiver name, elder name, session type

#### FilterTabs

- All: Show all conversations
- Active: Only active care sessions
- Unread: Only conversations with unread messages
- Archived: Show archived conversations

#### ConversationCard

- Caregiver avatar & name
- Elder name reference
- Session type & status badge
- Last message preview
- Unread badge count
- Timestamp
- Online status indicator

#### ChatHeader (Detail)

- Back button
- Caregiver profile & name
- Online/offline status
- Typing indicator
- Session status badge
- Quick action buttons (voice/video)

#### MessageBubble

- Spring animation on appearance
- Right-aligned for user messages (teal)
- Left-aligned for caregiver messages (gray)
- Delivery status indicators
- Timestamp
- Scalable padding and font

#### SystemMessage

- Timeline-style display
- Type-specific icons and colors
- Care update styling
- Centered alignment

#### CareUpdateCard

- Highlighted healthcare updates
- Type-specific icons (medication, meal, etc.)
- Details list
- Timestamp
- Color-coded by type

#### MessageComposer

- Expanding multi-line input
- Send button with spring animation
- Attachment & emoji placeholders
- Character count
- Keyboard-aware layout
- Loading state

### 4. State Management (Zustand)

**Store**: `useRelativeChatStore`

**State**:

```typescript
conversations: Conversation[]           // All conversations
activeConversationId: string | null     // Currently open chat
activeMessages: Message[]               // Messages in active chat
searchQuery: string                     // Search text
selectedFilter: FilterType              // Active filter tab
isLoading: boolean                      // Initial loading
isLoadingMessages: boolean              // Message loading
draftMessage: string                    // Composer draft
typingIndicator: Record<string, bool>   // Typing states
onlineStatuses: Record<string, bool>    // Online states
```

**Actions**:

- `setConversations()`: Update conversations
- `setActiveConversation()`: Select conversation
- `addMessage()`: Add message to thread
- `setDraftMessage()`: Update composer
- `sendMessage()`: Send with optimistic update
- `markAsRead()`: Mark messages as read
- `archiveConversation()`: Archive chat
- `muteConversation()`: Mute notifications
- Typing & online status setters

**Selectors**:

- `getFilteredConversations()`: Apply search & filter
- `getConversationById()`: Find conversation
- `getUnreadTotalCount()`: Total unread
- `getActiveSessionConversations()`: Active only

### 5. Custom Hooks

#### useRelativeChat()

High-level hook for chat operations

```typescript
const {
  selectedConversation,
  selectConversation,
  sendTextMessage,
  filteredConversations,
  unreadCount,
  activeSessionCount,
  isLoading,
} = useRelativeChat();
```

#### useConversationFilters()

Manage filtering and search

```typescript
const {
  activeFilter,
  searchQuery,
  setFilter,
  setSearch,
  clearFilters,
  filtered,
} = useConversationFilters();
```

#### useMessageComposer()

Manage message composition

```typescript
const { message, updateMessage, clearMessage, submit, isDraft, isLoading } =
  useMessageComposer(conversationId);
```

#### useConversationState()

Manage individual conversation state

```typescript
const { conversation, isTyping, isOnline, setTyping, archive, mute, unmute } =
  useConversationState(conversationId);
```

### 6. Data Types

**Conversation**

```typescript
{
  id: string
  caregiverId: string
  caregiver: CaregiverProfile
  elderId: string
  elder: ElderProfile
  sessionId: string
  session?: CareSession
  lastMessage?: Message
  unreadCount: number
  isArchived: boolean
  isMuted: boolean
  isTyping?: boolean
  createdAt: number
  updatedAt: number
}
```

**Message**

```typescript
{
  id: string;
  conversationId: string;
  senderId: string; // "relative" | "caregiver" | "system"
  senderName: string;
  messageType: MessageType; // "text" | "system" | "care-update"
  content: string;
  timestamp: number;
  deliveryStatus: DeliveryStatus; // "sending" | "sent" | "delivered" | "read"
  isRead: boolean;
}
```

**CareSession**

```typescript
{
  id: string
  elderId: string
  caregiverId: string
  sessionType: CareSessionType
  status: SessionStatus         // "active-session" | "completed" | "scheduled"
  startTime: number
  endTime?: number
  notes?: string
  location?: string
}
```

## Styling

### Color Palette

- **Primary Teal**: `#1fb299` (Active, highlights)
- **Text Dark**: `#0d5c63` (Headers, important text)
- **Text Medium**: `#333` (Body text)
- **Text Light**: `#666` (Secondary text)
- **Gray**: `#888`, `#999` (Disabled, tertiary)
- **Background**: `#f9fbfd` (Soft light)
- **Card**: `#fff` (White)
- **Danger**: `#ef4444` (Errors, alerts)

### Spacing & Dimensions

- **Border Radius**: 20px (cards), 24px (inputs), 16px (messages)
- **Padding**: 16px (default), 20px (container)
- **Avatar**: 50x50px (cards), 44x44px (header)
- **Icons**: 24x24px (actions), 20x20px (inline)

### Shadows

- **Card Shadow**: elevation 2, opacity 0.05
- **Button Shadow**: elevation 5, opacity 0.3
- **Header Shadow**: elevation 8, opacity 0.08

## Animations

Uses React Native Reanimated for smooth, performant animations:

1. **MessageBubble**: Spring animation on appearance (damping: 10)
2. **ConversationSkeleton**: Shimmer effect (1500ms)
3. **SendButton**: Scale animation (100ms each direction)
4. **Unread Badge**: Pulse animation (optional future)
5. **Typing Indicator**: Bounce animation (optional future)

## Performance

### Optimization Strategies

1. **FlatList Virtualization**: Only renders visible messages
2. **Memoization**: Components wrapped with React.memo
3. **Zustand Selectors**: Prevent unnecessary re-renders
4. **Image Optimization**: Using tintColor instead of separate images
5. **Lazy Loading**: Messages loaded per conversation

### Bundle Size

- Components: ~15KB
- Hooks: ~3KB
- Types: ~2KB
- Store: ~4KB
- Total: ~24KB (gzipped)

## Mock Data

`relativeChatMockData.ts` provides:

- 4 mock caregivers with ratings and specializations
- 4 mock elder profiles
- 4 mock care sessions in different statuses
- 10 mock messages spanning conversations
- Helper functions to access mock data

## Accessibility

**Features**:

- Large touch targets (44x44px minimum)
- Readable typography (14px+ for body)
- Color contrast: AA+ standard
- Screen reader support via labels
- Keyboard navigation
- Scalable fonts

## Future Enhancements

### Phase 2

- Real-time message sync (WebSocket)
- Message reactions & emoji
- Voice message support
- Image/document sharing
- Call integration (Twilio/Daily)

### Phase 3

- Message search
- Pin/unpin messages
- Message editing & deletion
- Call history
- Notification settings

### Phase 4

- End-to-end encryption
- Message signing
- Read receipts
- Typing notifications
- Presence indicators

## Integration Points

### Backend APIs (Future)

- `POST /api/relative/conversations` - Get conversations
- `GET /api/relative/conversations/:id/messages` - Get messages
- `POST /api/relative/conversations/:id/messages` - Send message
- `PUT /api/relative/conversations/:id/read` - Mark as read
- `WS /api/messages` - Real-time updates

### Navigation

Routes from the relative chat screen:

```
/(root)/(tabs)/relative/chat              # Conversation list
/(root)/chat-detail/[id]?role=relative    # Detail view
```

## Testing

### Unit Tests

- Store selectors and actions
- Hook behavior with different states
- Message formatting and time display
- Filter logic

### Component Tests

- Message bubble rendering
- Composer input and send
- Conversation card interactions
- Empty states and loading

### Integration Tests

- Full conversation flow
- Message sending and updates
- Filter and search functionality
- Navigation between screens

## Troubleshooting

### Messages not appearing

- Check store initialization with `initializeRelativeChatStore()`
- Verify message conversation ID matches
- Check FlatList keyExtractor

### Performance issues

- Use React DevTools Profiler
- Check for unnecessary re-renders
- Verify memo() usage
- Profile with React Native Debugger

### Style issues

- Verify all hex colors are valid
- Check borderRadius values (should be consistent)
- Verify shadow parameters
- Test on both iOS and Android

## Contributing

When adding features:

1. Add types to `types/relative-chat.ts`
2. Update store actions/selectors
3. Create reusable components
4. Add custom hooks if needed
5. Update documentation
6. Test on device

## License

Part of CareBridge healthcare platform.
