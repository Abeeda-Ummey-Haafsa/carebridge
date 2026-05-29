## **CareBridge** 

## **Relative Role — Backend TODO List** 

_For use with GitHub Copilot · Stack: Expo Router API Routes · PostgreSQL · Supabase Realtime · Expo Push Notifications · Stripe_ 

## **Legend** 

|🔴**Critical / blocking**|**[ ] Not started**|
|---|---|
|🟡**High priority**|**[~] In progress**|
|🟢**Standard priority**|**[x] Done**|



## **Screens & Phases Overview** 

This document is organized by screen, then by phase within each screen. Each phase maps directly to a UI section from the Relative dashboard prompts. 

|Screen|Phases|
|---|---|
|**Home Dashboard**|Phase 0 (Foundation) → Phase 9 (Loading<br>States)|
|**Find Care**|Phase 0 (Foundation) → Phase 8 (Booking<br>Preview)|
|**Sessions**|Phase 0 (Foundation) → Phase 10 (Review<br>& Rebook)|



|Screen|Phases|
|---|---|
|**Messages / Chat**|Phase 0 (Foundation) → Phase 7<br>(Notification Badges)|
|**Profile & Settings**|Phase 0 (Foundation) → Phase 10 (Account<br>Security)|
|**Shared Infrastructure**|Auth, DB utilities, push tokens, realtime,<br>error handling|



## **PHASE 0 — Foundation & Shared** 

## **Infrastructure** 

These tasks must be completed before any Relative-specific backend work begins. They are shared across all Relative screens. 

## **0.1 Database Verification** 

🔴 Verify users table has role = 'relative' in its CHECK constraint 

🔴 Verify elders table exists with all required columns: 

   - id, user_id, date_of_birth, medical_notes, allergies 

   - mobility_level CHECK (independent, walker, wheelchair, assisted, dependent) 

   - preferred_languages TEXT[], home_address, home_lat, home_lng, created_at 

- 🔴 Verify elder_relative_links table exists (elder_id, relative_user_id, relationship, is_primary) 

🔴 Verify care_sessions table has all status values: pending, accepted, declined, arriving, checked_in, paused, completed, cancelled 

🔴 Verify messages table exists with message_type CHECK (text, system, care_update) 

🟡 Verify payment_methods table exists (user_id, stripe_customer_id, stripe_payment_method_id, card_brand, card_last4, is_default) 

🟡 Verify payments table exists (session_id, payer_user_id, stripe_payment_intent_id, amount, status) 

🟡 Verify reviews table exists (session_id UNIQUE, reviewer_user_id, caregiver_id, rating, comment) 

- 🟡 Verify emergency_alerts table exists (elder_id, session_id, alert_type, lat, lng, acknowledged_at, acknowledged_by_user_id) 

🟢 Run ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now() if missing 

🟢 Confirm all indexes: idx_care_sessions_elder, idx_care_sessions_caregiver, 

idx_care_sessions_status, idx_messages_session 

## **0.2 Auth Middleware** 

🔴 Create requireAuth middleware — validates Clerk JWT, attaches req.user (id, clerk_id, role) 

🔴 Create requireRole('relative') middleware — rejects non-relative tokens with 403 

🟡 Create requireRelativeOwnership middleware — confirms relative is linked to the requested elder via elder_relative_links 

🟢 Write unit tests for requireRole('relative') with fixture users 

## **0.3 Shared Utilities** 

🟢 Create db.ts — pg connection pool wrapper (parameterized queries only, no raw string concatenation) 

🟢 Create asyncHandler wrapper for Expo Router API route error propagation 

🟢 Create standard API response shape: { success, data, error, meta } 

🟢 Create custom error classes: NotFoundError, ForbiddenError, ValidationError, ConflictError 

🟢 Create getRelativeElderIds(userId) utility — returns all elder IDs linked to a relative user (used for ownership checks) 

## **0.4 Push Notification Infrastructure** 

🔴 POST /api/relative/device-token — upsert Expo push token into device_tokens (ON CONFLICT DO NOTHING) 

   - Body: { token, platform } where platform is 'ios' or 'android' 

   - Call on every app launch — token can rotate 

- 🟡 DELETE /api/relative/device-token — remove token on logout 

   - Delete WHERE user_id = req.user.id AND token = :token 

💡 _Copilot prompt: "Upsert a device push token for a user using ON CONFLICT (user_id, token) DO NOTHING"_ 

## **SCREEN 1 — Home Dashboard** 

Powers the main Relative Home Dashboard screen with 9 UI sections. 

## **Phase 1 — Dashboard Header (Section 1)** 

## **1.1 GET /api/relative/profile** 

   - 🔴 Route: GET /api/relative/profile 

   - 🔴 Auth: requireAuth + requireRole('relative') 

   - 🔴 Query: SELECT id, name, email, created_at FROM users WHERE id = req.user.id 

   - 🟡 Return: { id, name, email, memberSince: created_at } 

   - 🟢 Handle edge case: user not found in users table → 404 with clear message 

- 💡 _Copilot prompt: "Generate an Express route GET /api/relative/profile that queries users table by clerk_id from JWT"_ 

## **1.2 GET /api/relative/elders** 

🔴 Route: GET /api/relative/elders 

🔴 Auth: requireAuth + requireRole('relative') 

   - 🔴 Query: SELECT elders.*, users.name, users.email FROM elder_relative_links JOIN elders JOIN users WHERE relative_user_id = req.user.id 

   - 🟡 Return per elder: { elderId, name, mobilityLevel, careStatus, preferredLanguages, homeAddress } 

   - 🟡 Include active session count per elder from care_sessions WHERE status IN 

   - ('arriving','checked_in','paused') 

   - 🟢 Return empty array [] if no elders linked — UI shows onboarding CTA 

- 💡 _Copilot prompt: "Query elder_relative_links joined with elders and users, also left join care_sessions to count active sessions per elder"_ 

## **Phase 2 — Active Care Session Card (Section 2)** 

## **2.1 GET /api/relative/session/active** 

- 🔴 Route: GET /api/relative/session/active 

- 🔴 Auth: requireAuth + requireRole('relative') 

- 🔴 Query: SELECT from care_sessions WHERE elder_id IN (relative's elders) AND 

status IN ('arriving','checked_in','paused') ORDER BY scheduled_at DESC LIMIT 1 

🔴 JOIN caregivers + users (caregiver side) to return caregiver_name 

🔴 JOIN elders + users (elder side) to return elder_name 

🟡 Return: session_id, care_type, status, caregiver_name, caregiver_id, elder_name, scheduled_at, checked_in_at, duration_minutes, estimated_end_time 

🟡 Compute elapsed_seconds server-side from checked_in_at to NOW() for timer sync 

- 🟡 Compute estimated_end_time = checked_in_at + duration_minutes * interval '1 minute' 

- 🟢 Return null data (not 404) when no active session — UI renders 'No Active Session' card 

💡 _Copilot prompt: "Find active care session for a relative by checking all their linked elders with caregiver and elder user joins"_ 

## **2.2 Realtime Active Session Updates** 

🔴 Set up Supabase Realtime channel or Socket.io room: session:{sessionId}:relative 

🔴 Emit event session_status_changed when care_sessions.status changes 

🟡 Emit event caregiver_location_updated when caregiver GPS updates 

🟡 Emit event session_note_added when new row inserted into session_notes 

- 🟢 Relative client subscribes on mount, unsubscribes on unmount 

## **Phase 3 — Quick Book Care CTA (Section 3)** 

## **3.1 GET /api/relative/caregivers/nearby-count** 

🟡 Route: GET /api/relative/caregivers/nearby-count 

🟡 Auth: requireAuth + requireRole('relative') 

- 🟡 Query param: ?elder_id= (optional) 

🟡 Count caregivers WHERE is_available = true AND distance(current_lat, current_lng, elder.home_lat, elder.home_lng) <= service_radius_km 

🟡 Return: { availableCount, radiusKm } 

- 🟢 Use Haversine formula in SQL for distance calculation 

## **Phase 4 — Upcoming Bookings (Section 4)** 

## **4.1 GET /api/relative/sessions/upcoming** 

🔴 Route: GET /api/relative/sessions/upcoming 

- 🔴 Auth: requireAuth + requireRole('relative') 

🔴 Query: SELECT from care_sessions WHERE elder_id IN (relative's elders) AND status IN ('pending','accepted') AND scheduled_at > NOW() ORDER BY scheduled_at ASC 

- 🔴 JOIN caregivers + users for caregiver_name, avg_rating 

🟡 Return per booking: { sessionId, careType, scheduledAt, durationMinutes, status, caregiverName, caregiverRating, elderName, hourlyRate, estimatedCost } 

🟢 Limit to next 10 upcoming bookings 

- 🟢 Compute countdown_seconds = EXTRACT(EPOCH FROM scheduled_at - NOW()) for timer 

## **Phase 5 — Elder Status Overview (Section 5)** 

## **5.1 GET /api/relative/elders/:elderId/status** 

🔴 Route: GET /api/relative/elders/:elderId/status 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

🔴 Return: { elderName, mobilityLevel, careStatus, lastCheckinAt, activeSession: { status, caregiverName } | null } 

🟡 Pull last check-in from care_sessions WHERE elder_id = :elderId AND checked_in_at IS NOT NULL ORDER BY checked_in_at DESC LIMIT 1 

🟢 Return medication reminder placeholder field (to be wired in future sprint) 

## **Phase 6 — Recent Caregiver Updates Feed (Section 6)** 

## **6.1 GET /api/relative/sessions/:sessionId/updates** 

🔴 Route: GET /api/relative/sessions/:sessionId/updates 

🔴 Auth: requireAuth + requireRole('relative') + verify relative owns this session's elder 

🔴 Query: SELECT from session_notes WHERE session_id = :sessionId ORDER BY created_at DESC LIMIT 20 

- 🟡 Return per update: { noteId, noteType, content, createdAt, caregiverName } 

🟡 Also include session_tasks WHERE is_completed = true as 'task_completed' update type 

- 🟢 Support ?since=ISO_TIMESTAMP for incremental polling 

## **6.2 GET /api/relative/activity-feed** 

- 🟡 Route: GET /api/relative/activity-feed 

- 🟡 Return last 15 note/task updates across ALL active sessions for all linked elders 

🟢 Useful for home dashboard feed 

## **Phase 7 — Emergency & SOS Alerts (Section 7)** 

## **7.1 GET /api/relative/alerts/active** 

🔴 Route: GET /api/relative/alerts/active 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Query: SELECT from emergency_alerts WHERE elder_id IN (relative's elders) AND acknowledged_at IS NULL ORDER BY created_at DESC 

🟡 Return: [ { alertId, alertType, elderName, createdAt, sessionId | null } ] 

🟢 Drive the pulsing emergency banner and alert priority badges on the dashboard 

## **7.2 PATCH /api/relative/alerts/:alertId/acknowledge** 

🔴 Route: PATCH /api/relative/alerts/:alertId/acknowledge 

🔴 Auth: requireAuth + requireRole('relative') + verify alert belongs to relative's elder 

🔴 Update emergency_alerts SET acknowledged_at = NOW(), 

acknowledged_by_user_id = req.user.id WHERE id = :alertId 

🔴 After update: emit event sos_acknowledged on Socket.io/Realtime channel elder:{elderId} 

🟡 Send Expo push to elder device: 'Your family has received your alert' 

## **Phase 8 — Mini Analytics Summary (Section 8)** 

## **8.1 GET /api/relative/dashboard-summary** 

- 🟡 Route: GET /api/relative/dashboard-summary 

- 🟡 Auth: requireAuth + requireRole('relative') 

- 🟡 Return aggregated in a single query: totalCareHoursThisWeek, 

completedSessionsCount, averageCaregiverRating, upcomingBookingsCount 

- 🟢 Single endpoint to minimize client requests on dashboard mount 

## **Phase 9 — Loading & Refresh States (Section 9)** 

## **9.1 Pull-to-Refresh Support** 

🟢 All dashboard endpoints support cache-busting via ?t= timestamp param 🟢 Set Cache-Control: no-store on dashboard routes to prevent stale data 

## **SCREEN 2 — Find Care Screen** 

The most important screen in the Relative Dashboard — Uber-style caregiver discovery and booking. 

## **Phase 1 — Caregiver Map & Nearby List (Sections** 

## **1–4)** 

## **1.1 GET /api/caregivers/nearby** 

🔴 Route: GET /api/caregivers/nearby 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Query params: ?lat=&lng=&radius_km= (required) + ?care_type= + ?min_rating= + ?max_rate= + ?language= 

🔴 Query: SELECT caregivers.* FROM caregivers WHERE is_available = true AND distance(current_lat, current_lng, :lat, :lng) <= :radius_km 

🔴 JOIN users to return caregiver full name 

🔴 Return per caregiver: { caregiverId, name, avgRating, totalReviews, hourlyRate, yearsExperience, careTypes, languages, distanceKm, estimatedArrivalMinutes } 

🟡 Compute estimatedArrivalMinutes using Haversine with 30s cache 

🟡 Apply all filter query params with parameterized WHERE clauses 

🟡 Support sort: ?sort=nearest|highest_rated|lowest_price|fastest_arrival 

🟢 Limit: 20 results default, max 50 

## **1.2 GET /api/caregivers/:caregiverId** 

🔴 Route: GET /api/caregivers/:caregiverId 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Return full caregiver profile: bio, hourly_rate, years_experience, care_types, languages, avg_rating, total_reviews, service_radius_km 

🔴 JOIN caregiver_certifications — return verified certifications list 

🟡 JOIN caregiver_availability — return weekly schedule (day_of_week, start_time, end_time) 

🟡 Include total completed sessions count from care_sessions WHERE caregiver_id = :id AND status = 'completed' 

🟢 Handle 404 if caregiver not found or not active 

## **1.3 GET /api/caregivers/:caregiverId/reviews** 

🟡 Route: GET /api/caregivers/:caregiverId/reviews 

- 🟡 Auth: requireAuth + requireRole('relative') 

- 🟡 Query reviews WHERE caregiver_id = :id ORDER BY created_at DESC LIMIT 10 

🟡 JOIN users (reviewer side) to return reviewer name 

🟡 Return: { rating, comment, reviewerName, createdAt, careType } 

🟢 Support pagination: ?page= &limit= 

## **Phase 2 — Booking Flow (Sections 5–7)** 

## **2.1 POST /api/relative/bookings** 

🔴 Route: POST /api/relative/bookings 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership on elder_id 

🔴 Body: { elder_id, caregiver_id, care_type, scheduled_at, duration_minutes, is_immediate } 

🔴 Validate: caregiver is_available = true, no overlapping sessions for caregiver or elder 

🔴 Compute total_cost = hourly_rate * (duration_minutes / 60), snapshot hourly_rate from caregivers table 

- 🔴 INSERT into care_sessions with status = 'pending' 

🔴 Snapshot elder_address, elder_lat, elder_lng from elders table at booking time 

🔴 After insert: send Expo push notification to caregiver device: '{elderName} has requested {careType} care' 

🔴 After insert: insert system message into messages: 'Booking request created' with message_type = 'system' 

🟡 Return: { sessionId, status: 'pending', scheduledAt, estimatedCost, caregiverName } 

🟢 Validate scheduled_at is in the future (at least 30 minutes from now for non-immediate bookings) 

⚠ _Overlap check: SELECT COUNT(*) from care_sessions WHERE caregiver_id = :id AND status NOT IN ('declined','cancelled','completed') AND scheduled_at overlaps new booking window_ 

## **2.2 PATCH /api/relative/bookings/:sessionId/cancel** 

🔴 Route: PATCH /api/relative/bookings/:sessionId/cancel 

🔴 Auth: requireAuth + requireRole('relative') + verify relative owns session's elder 🔴 Allow cancel only when status IN ('pending','accepted') — reject if 

arriving/checked_in/completed 

🔴 UPDATE care_sessions SET status = 'cancelled', updated_at = NOW() WHERE id = :sessionId 

🟡 Send Expo push to caregiver: 'Booking for {elderName} has been cancelled' 

🟡 Insert system message into messages: 'Booking cancelled by relative' 

🟢 Return updated session status 

## **2.3 PATCH /api/relative/bookings/:sessionId/reschedule** 

🟡 Route: PATCH /api/relative/bookings/:sessionId/reschedule 

🟡 Body: { scheduled_at, duration_minutes } 

🟡 Allow reschedule only when status IN ('pending','accepted') 

- 🟡 Re-validate overlap check with new scheduled_at 

🟡 UPDATE care_sessions SET scheduled_at = :new_time, duration_minutes = 

:new_duration, updated_at = NOW() 

- 🟡 Send Expo push to caregiver: 'Booking has been rescheduled' 

## **Phase 3 — Filter & Sort Modal (Section 6)** 

## **3.1 GET /api/caregivers/filter-options** 

🟢 Route: GET /api/caregivers/filter-options 

🟢 Return available filter options (dynamic from DB): unique care_types, languages, min/max hourly_rate range, experience range 

🟢 Used to populate filter modal sliders and chip selectors 

## **SCREEN 3 — Sessions Screen** 

Manages all caregiver bookings, session history, timeline, payments, and reviews for the Relative. 

## **Phase 1 — Sessions Header & Summary (Section 1)** 

## **1.1 GET /api/relative/sessions/summary** 

🔴 Route: GET /api/relative/sessions/summary 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Return: { activeCount, upcomingCount, completedCount, cancelledCount, totalCount } 

🟡 Single aggregated query using COUNT + CASE WHEN for each status group 

## **Phase 3 — Session Timeline (Sections 3–6)** 

## **3.1 GET /api/relative/sessions** 

🔴 Route: GET /api/relative/sessions 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Query params: ?status= (all|upcoming|active|completed|cancelled) + ?search= + 

?sort= + ?page= + ?limit= 

🔴 Query: SELECT from care_sessions WHERE elder_id IN (relative's elders) 

🔴 JOIN caregivers + users (caregiver) to return caregiver_name, avg_rating 

🔴 JOIN elders + users (elder) to return elder_name 

🟡 Return per session: { sessionId, careType, status, scheduledAt, durationMinutes, checkedInAt, checkedOutAt, totalCost, caregiverName, elderName, location, notes_preview } 

🟡 Include notes_preview: first 80 chars of most recent session_note 

🟡 Support search by caregiver name, elder name, care type (ILIKE) 

🟡 Sort options: newest_first, oldest_first, highest_payment, upcoming_first 

🟢 Default: page=1, limit=20, sort=newest_first 

- 🟢 Return pagination meta: { total, page, limit, hasMore } 

## **3.2 GET /api/relative/sessions/:sessionId** 

🔴 Route: GET /api/relative/sessions/:sessionId 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

- 🔴 Return full session detail: 

   - Session core fields: all care_sessions columns 

   - Caregiver info: name, avg_rating, bio, care_types, languages 

   - Elder info: name, mobility_level, allergies, preferred_languages 

   - Session notes: full notes list from session_notes 

   - Session tasks: full task list from session_tasks with completion status 

   - Payment: from payments table if exists 

   - Review: from reviews table if exists 

## **Phase 5 — Payment & Spending Summary (Section 8)** 

## **5.1 GET /api/relative/payments/summary** 

- 🔴 Route: GET /api/relative/payments/summary 

- 🔴 Auth: requireAuth + requireRole('relative') 

- 🔴 Return: { totalSpentThisMonth, activeBookingCosts, completedSessionPayments, averageSessionCost } 

- 🟡 totalSpentThisMonth: SUM(amount) from payments WHERE payer_user_id = req.user.id AND status = 'succeeded' AND paid_at >= start of month 

- 🟡 activeBookingCosts: SUM(estimated total_cost) from care_sessions WHERE status IN ('pending','accepted') 

- 🟢 Return trend: this month vs last month % change 

## **5.2 GET /api/relative/payments/history** 

- 🟡 Route: GET /api/relative/payments/history 

- 🟡 Auth: requireAuth + requireRole('relative') 

- 🟡 Query: SELECT payments.* from payments WHERE payer_user_id = req.user.id ORDER BY paid_at DESC 

- 🟡 JOIN care_sessions to return care_type and elder_name per payment 

- 🟢 Support pagination: ?page= &limit=10 

## **5.3 GET /api/relative/payments/analytics** 

🟡 Route: GET /api/relative/payments/analytics 

🟡 Return: weekly_breakdown (last 8 weeks), monthly_breakdown (last 6 months) 

- 🟡 Weekly: GROUP BY week number, SUM(amount) per week 

- 🟡 Monthly: GROUP BY month, SUM(amount) per month 

- 🟢 Powers react-native-gifted-charts bar charts in Sessions screen 

## **Phase 6 — Review & Rebook (Section 9)** 

## **6.1 POST /api/relative/sessions/:sessionId/review** 

🔴 Route: POST /api/relative/sessions/:sessionId/review 

- 🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

- 🔴 Validate: session status = 'completed' AND no existing review (UNIQUE constraint on session_id) 

- 🔴 Body: { rating (1–5), comment } 

- 🔴 INSERT into reviews (session_id, reviewer_user_id, caregiver_id, rating, comment) 

- 🔴 After insert: UPDATE caregivers SET avg_rating = new avg, total_reviews = total_reviews + 1 

🟡 Recalculate avg_rating with: (avg_rating * total_reviews + new_rating) / (total_reviews + 1) 

🟡 Send Expo push to caregiver: '{relativeName} left you a {rating}-star review' 

🟢 Return: { reviewId, rating, createdAt } 

## **6.2 GET /api/relative/caregivers/:caregiverId/rebook** 

🟢 Route: GET /api/relative/caregivers/:caregiverId/rebook 

🟢 Return last completed session with this caregiver to pre-fill booking form 

🟢 Return: { lastCareType, lastDuration, caregiverName, hourlyRate, availability } 

## **SCREEN 4 — Messages / Chat Screen** 

Realtime session-linked messaging between relatives and caregivers. 

## **Phase 1 — Conversation List (Section 1)** 

## **1.1 GET /api/relative/conversations** 

🔴 Route: GET /api/relative/conversations 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Return a conversation per care_session for all sessions of relative's elders 

🔴 Query: SELECT DISTINCT ON (session_id) from messages joined with care_sessions WHERE elder_id IN (relative's elders) ORDER BY session_id, created_at DESC 

🔴 Per conversation: { sessionId, careType, status, caregiverName, elderName, lastMessageContent, lastMessageAt, unreadCount } 

🟡 Compute unreadCount: COUNT(*) from messages WHERE session_id = :id AND sender_user_id != req.user.id AND is_read = false 

🟡 Filter tabs support: ?filter=all|active|unread|archived 

🟢 Sort: conversations with unread messages first, then by lastMessageAt DESC 

## **1.2 GET /api/relative/conversations/unread-count** 

🔴 Route: GET /api/relative/conversations/unread-count 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Return: { totalUnread } — used for tab bar notification badge 

- 🟢 Called on app focus to update badge count 

## **Phase 2 — Active Chat View (Sections 3–4)** 

## **2.1 GET /api/relative/sessions/:sessionId/messages** 

- 🔴 Route: GET /api/relative/sessions/:sessionId/messages 

- 🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

🔴 Query: SELECT from messages WHERE session_id = :sessionId ORDER BY created_at ASC 

- 🔴 Return per message: { messageId, content, messageType, senderUserId, senderName, isRead, createdAt } 

- 🟡 Support cursor-based pagination: ?before=messageId&limit=30 for loading older messages 

- 🟢 Include session context in first call: { session: { careType, status, caregiverName, elderName }, messages: [...] } 

## **2.2 POST /api/relative/sessions/:sessionId/messages** 

🔴 Route: POST /api/relative/sessions/:sessionId/messages 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

- 🔴 Body: { content, message_type: 'text' } 

🔴 Validate: session status NOT IN ('completed','cancelled','declined') — cannot message after session ends 

- 🔴 INSERT into messages (session_id, sender_user_id, content, message_type) 

- 🔴 After insert: emit event new_message on Realtime/Socket.io channel 

session:{sessionId}:caregiver 

🔴 Send Expo push to caregiver: '{relativeName}: {content_preview}' 

🟡 Return: { messageId, content, createdAt } 

## **2.3 PATCH /api/relative/sessions/:sessionId/messages/read** 

🔴 Route: PATCH /api/relative/sessions/:sessionId/messages/read 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 UPDATE messages SET is_read = true WHERE session_id = :id AND sender_user_id != req.user.id AND is_read = false 

- 🟡 Emit event messages_read on session channel so caregiver sees read receipts 

- 🟢 Call when conversation is opened or scrolled to bottom 

## **Phase 3 — Realtime Messaging Infrastructure** 

## **(Sections 3–4)** 

## **3.1 Socket.io / Supabase Realtime Channels** 

🔴 Create room session:{sessionId}:relative for relative-facing events 

- 🔴 Emit event new_message when caregiver sends a message 

- 🔴 Emit event care_update_received when a session_note is added (message_type = 'care_update') 

- 🟡 Emit event typing_started / typing_stopped based on caregiver typing state (POST /sessions/:id/typing) 

🟢 Relative client subscribes to session channel on chat open, unsubscribes on leave 

## **SCREEN 5 — Profile & Settings Screen** 

Account management, elder management, payment methods, notification settings, and activity analytics. 

## **Phase 1 — Profile Header (Section 1)** 

## **1.1 GET /api/relative/me** 

- 🔴 Route: GET /api/relative/me 

- 🔴 Auth: requireAuth + requireRole('relative') 

- 🔴 Return: { id, name, email, createdAt, elderCount, activeSessionCount, 

completedBookingsCount, emergencyContactsCount } 

🟡 elderCount: COUNT from elder_relative_links WHERE relative_user_id = req.user.id 

🟡 completedBookingsCount: COUNT from care_sessions WHERE elder_id IN (elders) AND status = 'completed' 

🟡 activeSessionCount: COUNT WHERE status IN ('arriving','checked_in','paused') 

🟢 Compute profileCompletionPercent (placeholder for now — email verified + elders linked + payment method = 100%) 

## **1.2 PATCH /api/relative/me** 

🟡 Route: PATCH /api/relative/me 

- 🟡 Allowed fields: name only (email managed by Clerk) 

- 🟡 UPDATE users SET name = :name WHERE id = req.user.id 

🟢 Return updated user object 

## **Phase 2 — Elder Management (Section 2)** 

## **2.1 POST /api/relative/elders** 

🔴 Route: POST /api/relative/elders 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Body: { name, email, dateOfBirth, mobilityLevel, medicalNotes, allergies, 

preferredLanguages, homeAddress, homeLat, homeLng, relationship } 

🔴 Step 1: INSERT into users (name, email, role = 'elder', clerk_id = generated placeholder) 

🔴 Step 2: INSERT into elders (user_id, date_of_birth, medical_notes, allergies, 

mobility_level, preferred_languages, home_address, home_lat, home_lng) 

🔴 Step 3: INSERT into elder_relative_links (elder_id, relative_user_id, relationship, is_primary = true if first elder) 

🟡 Wrap all 3 inserts in a database transaction — rollback on any failure 

🟢 Return: { elderId, name, mobilityLevel } 

⚠ _Use a DB transaction: BEGIN / INSERT users / INSERT elders / INSERT_ 

_elder_relative_links / COMMIT — rollback on error_ 

## **2.2 PATCH /api/relative/elders/:elderId** 

🔴 Route: PATCH /api/relative/elders/:elderId 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

🔴 Updatable fields: name (users table), date_of_birth, medical_notes, allergies, 

mobility_level, preferred_languages, home_address, home_lat, home_lng (elders table) 🟡 UPDATE both users and elders tables (two separate UPDATE statements or CTE) 🟢 Return updated elder profile 

## **2.3 DELETE /api/relative/elders/:elderId (soft unlink)** 

🟡 Route: DELETE /api/relative/elders/:elderId 

🟡 Does NOT delete elder record — removes elder_relative_links row only (soft unlink) 

🟡 Block if elder has active sessions: status IN ('arriving','checked_in','paused') 

🟢 Return 204 No Content on success 

## **Phase 3 — Emergency Contacts (Section 2 — Elder** 

## **Cards)** 

## **3.1 GET /api/relative/elders/:elderId/emergency-contacts** 

🔴 Route: GET /api/relative/elders/:elderId/emergency-contacts 

🔴 Auth: requireAuth + requireRole('relative') + requireRelativeOwnership 

🔴 Query: SELECT from elder_emergency_contacts WHERE elder_id = :elderId ORDER BY is_primary DESC 

🟡 Return: [ { id, name, phone, relationship, isPrimary } ] 

## **3.2 POST /api/relative/elders/:elderId/emergency-contacts** 

🔴 Route: POST /api/relative/elders/:elderId/emergency-contacts 

🔴 Body: { name, phone, relationship, is_primary } 

- 🔴 INSERT into elder_emergency_contacts 

🟡 If is_primary = true: UPDATE existing primary contacts SET is_primary = false first 

## **3.3 DELETE** 

## **/api/relative/elders/:elderId/emergency-contacts/:contactId** 

🟡 Verify contactId belongs to elder before DELETE 

🟢 Return 204 No Content 

## **Phase 4 — Payment Methods (Section 3)** 

## **4.1 GET /api/relative/payment-methods** 

🔴 Route: GET /api/relative/payment-methods 

🔴 Auth: requireAuth + requireRole('relative') 

🔴 Query: SELECT from payment_methods WHERE user_id = req.user.id ORDER BY is_default DESC 

🟡 Return: [ { id, cardBrand, cardLast4, expMonth, expYear, isDefault } ] 

🟢 Never return full card numbers or stripe_payment_method_id to client 

## **4.2 POST /api/relative/payment-methods** 

🟡 Route: POST /api/relative/payment-methods 

🟡 Body: { stripePaymentMethodId } — token from Stripe.js on client 

🟡 Server-side: attach payment method to Stripe customer (create customer if first 

method) 

🟡 INSERT into payment_methods (user_id, stripe_customer_id, 

stripe_payment_method_id, card_brand, card_last4, exp_month, exp_year) 

🟡 If first method: set is_default = true 

🟢 Return saved card preview: { id, cardBrand, cardLast4, isDefault } 

⚠ _Never store full card numbers. Always use Stripe.js tokenization client-side and only store Stripe IDs server-side._ 

## **4.3 PATCH /api/relative/payment-methods/:id/default** 

🟡 Update all methods SET is_default = false, then SET is_default = true WHERE id = :id 

## **4.4 DELETE /api/relative/payment-methods/:id** 

🟡 Detach from Stripe customer and DELETE from payment_methods 

🟡 Block delete if this is the only payment method and there are pending bookings 

## **Phase 5 — Notification Settings (Section 4)** 

## **5.1 GET /api/relative/notification-preferences** 

🟡 Route: GET /api/relative/notification-preferences 

🟡 Auth: requireAuth + requireRole('relative') 

🟡 Return preferences object: { sessionUpdates, caregiverMessages, emergencyAlerts, bookingReminders, paymentNotifications, caregiverArrivalAlerts } 

🟢 Store in a JSONB column on users table OR a separate notification_preferences table (recommend JSONB for simplicity) 

## **5.2 PATCH /api/relative/notification-preferences** 

🟡 Body: partial preferences object — merge with existing 

🟡 Validate: all values must be boolean 

- 🟢 Return updated preferences 

## **Phase 6 — Activity Analytics (Section 7)** 

## **6.1 GET /api/relative/analytics** 

🟡 Route: GET /api/relative/analytics 

- 🟡 Auth: requireAuth + requireRole('relative') 

🟡 Return: { activeCareSessions, totalCompletedBookings, monthlySpend, averageCaregiverRating, bookingFrequencyByMonth, spendingTrendByMonth } 

🟡 monthlySpend: SUM from payments WHERE paid_at in current month 

🟡 averageCaregiverRating: AVG(rating) from reviews WHERE reviewer_user_id = req.user.id 

🟡 bookingFrequencyByMonth: COUNT of care_sessions grouped by 

EXTRACT(MONTH) for last 6 months 

🟢 Powers react-native-gifted-charts analytics in Profile screen 

## **Phase 7 — Notifications Feed** 

## **7.1 GET /api/relative/notifications** 

- 🟡 Route: GET /api/relative/notifications 

🟡 Auth: requireAuth + requireRole('relative') 

🟡 Query notifications WHERE user_id = req.user.id ORDER BY created_at DESC LIMIT 20 

- 🟢 Support ?unread_only=true param 

- 🟢 Return: id, title, body, type, is_read, created_at, related_id, related_type 

## **7.2 PATCH /api/relative/notifications/:id/read** 

🟢 Set is_read = true WHERE id = :id AND user_id = req.user.id 

## **7.3 PATCH /api/relative/notifications/read-all** 

🟢 UPDATE notifications SET is_read = true WHERE user_id = req.user.id AND is_read 

= false 

## **Phase 8 — Account & Security (Section 8)** 

## **8.1 POST /api/auth/logout (Shared)** 

🔴 Route: POST /api/auth/logout 

🔴 Delete all device_tokens for req.user.id on logout (stop push after sign-out) 

🟡 Invalidate any active server-side sessions if applicable 

🟢 Return 204 No Content 

## **PHASE X — Security, Validation & Rate Limiting** 

## **X.1 Input Validation** 

🔴 Apply zod or joi schema validation to ALL POST/PATCH body inputs across all Relative routes 

🔴 Validate lat/lng: latitude BETWEEN -90 AND 90, longitude BETWEEN -180 AND 180 

🔴 Validate scheduled_at is a valid ISO 8601 timestamp in the future 

🔴 Validate duration_minutes > 0 AND duration_minutes <= 1440 (max 24h session) 

🟡 Validate rating is an integer BETWEEN 1 AND 5 on review POST 

🟡 Sanitize all free-text fields (bio, comment, notes) — use parameterized queries throughout 

🟡 Validate elder_id in booking request belongs to authenticated relative 

## **X.2 Authorization Checks** 

🔴 Every route accepting an elderId must verify elder_relative_links.relative_user_id = req.user.id 

🔴 Every route accepting a sessionId must verify the session's elder is linked to the relative 

🔴 Relative cannot read another relative's bookings, payments, or conversations 

🟡 Payment method routes must verify payment_methods.user_id = req.user.id 

🟡 Review POST must verify session was booked by this relative (booked_by_user_id = req.user.id) 

## **X.3 Rate Limiting** 

🟡 Booking creation: max 10 new bookings per relative per day — prevent spam 

🟡 Message sending: max 60 messages per session per minute per user 

🟢 General API: 100 requests per minute per user (express-rate-limit) 

🟢 Use Redis store in production, in-memory for development 

## **PHASE Y — Testing** 

## **Y.1 Unit Tests** 

🟡 Test requireRole('relative') middleware rejects caregiver and elder tokens 

🟡 Test requireRelativeOwnership blocks access to elder not linked to relative 

🟡 Test POST /api/relative/bookings validates overlap detection 

🟡 Test POST /api/relative/sessions/:id/review blocks duplicate reviews 

🟢 Test Haversine distance calculation utility with known coordinates 

## **Y.2 Integration Tests** 

🟡 Full booking flow: POST /bookings → caregiver accepts → session arriving → checked_in → completed 

- 🟡 Message flow: relative sends message → caregiver receives Realtime event → relative sees read receipt 

🟡 Emergency alert flow: elder triggers SOS → relative receives push + sees alert → relative acknowledges → elder receives confirmation 

🟡 Payment flow: add payment method → book session → session completes → payment recorded 

🟢 Elder management flow: add elder → link to relative → create booking for elder → confirm session appears in relative's sessions list 

💡 _Copilot prompt: "Write a supertest integration test for POST /api/relative/bookings that mocks caregiver lookup, validates overlap check, and asserts session insert and push notification"_ 

## **Y.3 Manual QA Checklist** 

🟢 Relative profile loads correctly for a seeded relative user with linked elders 

🟢 Nearby caregivers returns filtered results with correct distance calculation 

🟢 Booking creation sends push notification to correct caregiver device 

🟢 Active session card on Home dashboard updates in realtime when caregiver checks in 

🟢 Caregiver update notes appear in Messages chat thread as care_update bubbles 

🟢 SOS acknowledgement clears emergency banner on relative dashboard 

🟢 Payment history shows correct amount and session association 

🟢 Review submitted updates caregiver avg_rating correctly 

🟢 No relative data leaks across different relative accounts 

## **API Route Summary Reference** 

## **Home Dashboard Routes** 

|Method|Route|Purpose|Priority|
|---|---|---|---|
|GET|/api/relative/profile|Relative greeting +<br>header|🔴|
|GET|/api/relative/elders|Elder switcher<br>dropdown|🔴|
|GET|/api/relative/session/<br>active|Active session card|🔴|



## **GitHub Copilot Workflow Tips** 

Paste these prompts directly into GitHub Copilot Chat for fast scaffolding. 

## **Tip 1 — Relative profile endpoint** 

"Generate an Expo Router API route GET /api/relative/profile that queries users table by clerk_id from JWT, returns name, email, createdAt" 

## **Tip 2 — Nearby caregivers with Haversine** 

"Write a parameterized PostgreSQL query using Haversine formula to find available caregivers (is_available=true) within a radius in km from a lat/lng point, supporting optional filters: care_type array contains, min_rating, max hourly_rate, language array contains, sorted by distance ASC" 

## **Tip 3 — Booking with overlap validation** 

"Create an Expo Router POST handler for /api/relative/bookings that: 

1) validates no overlapping sessions for the caregiver, 

2) snapshots hourly_rate and elder location at booking time, 

3) inserts care_session with status='pending', 

4) sends Expo push notification to caregiver device token" 

_CareBridge Relative Role Backend TODO v1.0 · Generated for GitHub Copilot use_ 

