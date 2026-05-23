# Relative Chat - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Initialize the Store

```typescript
// In your app root or splash screen
import { initializeRelativeChatStore } from "@/store/relativeChatStore";

useEffect(() => {
  initializeRelativeChatStore();
}, []);
```

### 2. Use the Chat Screen

The chat screen is already integrated at:

```
app/(root)/(tabs)/relative/chat.tsx
```

Just navigate to the Relative tab and select "Chat" - it works out of the box!

### 3. Navigate to Details

When a user taps a conversation, they're automatically routed to:

```
app/(root)/(tabs)/relative/chat-detail/[id].tsx
```

### 4. Send a Message

Use the `useRelativeChat` hook:

```typescript
const { sendTextMessage, selectedConversation } = useRelativeChat();

const handleSend = async (text: string) => {
  if (selectedConversation) {
    await sendTextMessage(selectedConversation.id, text);
  }
};
```

### 5. Display Unread Badge

Show unread count on the tab bar:

```typescript
const { unreadCount } = useRelativeChat();

return <Badge count={unreadCount} />;
```

---

## 📚 Component Quick Reference

### Display Conversations

```typescript
import { ConversationCard } from "@/app/(root)/(tabs)/relative/components";

<FlatList
  data={conversations}
  renderItem={({ item }) => (
    <ConversationCard
      conversation={item}
      onPress={() => openChat(item.id)}
    />
  )}
/>
```

### Search & Filter

```typescript
import { SearchBar, FilterTabs } from "@/app/(root)/(tabs)/relative/components";

<SearchBar value={query} onChangeText={setQuery} />
<FilterTabs activeTab={filter} onTabChange={setFilter} />
```

### Message Composer

```typescript
import { MessageComposer } from "@/app/(root)/(tabs)/relative/components";

<MessageComposer
  value={message}
  onChangeText={setMessage}
  onSend={handleSend}
/>
```

---

## 🎯 Common Tasks

### Get All Conversations

```typescript
const store = useRelativeChatStore();
const conversations = store.conversations;
```

### Get Filtered Conversations

```typescript
const store = useRelativeChatStore();
const filtered = store.getFilteredConversations();
```

### Get Unread Count

```typescript
const store = useRelativeChatStore();
const unread = store.getUnreadTotalCount();
```

### Send a Message

```typescript
const store = useRelativeChatStore();
await store.sendMessage(conversationId, "Hello!");
```

### Archive a Conversation

```typescript
const store = useRelativeChatStore();
store.archiveConversation(conversationId);
```

### Mute Notifications

```typescript
const store = useRelativeChatStore();
store.muteConversation(conversationId);
```

### Mark as Read

```typescript
const store = useRelativeChatStore();
store.markAsRead(conversationId, messageIds);
```

---

## 🪝 Hook Quick Reference

### useRelativeChat

```typescript
const {
  selectedConversation, // Current conversation
  selectConversation, // Select a conversation
  clearSelection, // Close chat
  sendTextMessage, // Send message
  filteredConversations, // Filtered list
  unreadCount, // Total unread
  activeSessionCount, // Active sessions
  isLoading, // Loading state
} = useRelativeChat();
```

### useConversationFilters

```typescript
const {
  activeFilter, // "all" | "active" | "unread" | "archived"
  searchQuery, // Search text
  setFilter, // Change filter
  setSearch, // Update search
  clearFilters, // Reset both
  filtered, // Filtered results
} = useConversationFilters();
```

### useMessageComposer

```typescript
const {
  message, // Current message text
  updateMessage, // Set message text
  clearMessage, // Clear composer
  submit, // Send message
  isDraft, // Has text?
  isLoading, // Sending?
} = useMessageComposer(conversationId);
```

### useConversationState

```typescript
const {
  conversation, // Full conversation
  isOnline, // Caregiver online?
  isTyping, // Caregiver typing?
  setTyping, // Set typing state
  archive, // Archive chat
  mute, // Mute notifications
  unmute, // Unmute notifications
} = useConversationState(conversationId);
```

---

## 🎨 Styling & Customization

### Change Primary Color

```typescript
// In all component files, replace:
// #1fb299 → your color

const TEAL = "#1fb299"; // Change this
```

### Change Font Sizes

```typescript
const styles = StyleSheet.create({
  messageText: {
    fontSize: 16, // Change from 15
  },
});
```

### Change Animations

```typescript
// In MessageBubble.tsx
useEffect(() => {
  scaleAnimation.value = withSpring(1, {
    damping: 20, // Increase for slower
    mass: 1,
    stiffness: 100,
  });
}, []);
```

---

## 🔗 Integration with Backend

When you're ready to connect to a real backend:

### 1. Replace Mock Data

```typescript
// In relativeChatStore.ts
useEffect(() => {
  // Instead of:
  // initializeRelativeChatStore();

  // Call your API:
  fetch("/api/relative/conversations")
    .then((res) => res.json())
    .then((data) => setConversations(data));
}, []);
```

### 2. Add Real Message Sending

```typescript
// In sendMessage action
const response = await fetch(
  `/api/relative/conversations/${conversationId}/messages`,
  {
    method: "POST",
    body: JSON.stringify({ content }),
  },
);
const newMessage = await response.json();
addMessage(newMessage);
```

### 3. Set Up WebSocket

```typescript
const ws = new WebSocket("wss://api.carebridge.local/messages");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  store.addMessage(message);
};
```

---

## 🐛 Debugging

### Enable Logging

```typescript
// Add this to any component:
useEffect(() => {
  useRelativeChatStore.subscribe((state) => {
    console.log("Chat store updated:", state);
  });
}, []);
```

### Check Store State

```typescript
// In DevTools console:
useRelativeChatStore.getState();
```

### Monitor Messages

```typescript
const store = useRelativeChatStore();
console.log("Active messages:", store.activeMessages);
console.log("Conversations:", store.conversations);
```

---

## 📋 Checklist

Before going to production:

- [ ] Initialize store on app launch
- [ ] Connect to real backend API
- [ ] Set up WebSocket for real-time updates
- [ ] Test on real devices (iOS & Android)
- [ ] Add push notifications
- [ ] Implement proper error handling
- [ ] Add analytics tracking
- [ ] Test with real data volume
- [ ] Performance test scrolling
- [ ] Accessibility audit

---

## 📚 Learn More

- **Full Documentation**: See [README.md](./README.md)
- **Integration Examples**: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Type Definitions**: See [types/relative-chat.ts](../../types/relative-chat.ts)
- **Store Actions**: See [store/relativeChatStore.ts](../../store/relativeChatStore.ts)

---

## ❓ FAQ

**Q: How do I test without a backend?**
A: The system includes mock data. Just call `initializeRelativeChatStore()` and everything works!

**Q: Can I customize the design?**
A: Yes! All colors, fonts, and spacing are in StyleSheet objects. Easy to modify.

**Q: How do I add real-time updates?**
A: Listen to store changes with `subscribe()` and/or set up WebSocket in the store.

**Q: What about offline support?**
A: Use AsyncStorage with the store to persist conversations locally.

**Q: Can I use this for other messaging?**
A: Yes! The system is generic. Just replace data types and styling.

---

## 🎉 You're All Set!

The Relative Chat system is ready to use. Navigate to the app and try it out!

**Next Steps**:

1. Run the app: `npx expo start`
2. Go to the Relative tab
3. Tap "Chat"
4. Tap a conversation
5. Send a message!

Enjoy! 💬
