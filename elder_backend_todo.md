# CareBridge — Elder Role Backend TODO List
> For use with **GitHub Copilot** · Stack: Node.js / Express (or NestJS) · PostgreSQL · Supabase Realtime / Socket.io · Expo Push Notifications

---

## Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- 🔴 Critical / blocking
- 🟡 High priority
- 🟢 Standard priority

---

## PHASE 0 — Foundation & Shared Infrastructure

> These must exist before any Elder-specific work begins. Tick these off first.

### 0.1 Database — Elder Tables
- [ ] 🔴 Verify `users` table has `role = 'elder'` constraint in place
- [ ] 🔴 Verify `elders` table exists with all columns:
  - `id`, `user_id`, `date_of_birth`, `medical_notes`, `allergies`
  - `mobility_level` CHECK constraint (`independent`, `walker`, `wheelchair`, `assisted`, `dependent`)
  - `preferred_languages TEXT[]`, `home_address`, `home_lat`, `home_lng`, `created_at`
- [ ] 🔴 Verify `elder_relative_links` table exists (`elder_id`, `relative_user_id`, `relationship`, `is_primary`)
- [ ] 🟡 Verify `elder_emergency_contacts` table exists (`elder_id`, `name`, `phone`, `relationship`, `is_primary`)
- [ ] 🟢 Run `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()` if missing
- [ ] 🟢 Confirm all foreign key indexes are applied (`idx_emergency_alerts_elder`, etc.)

### 0.2 Auth Middleware
- [ ] 🔴 Create `requireAuth` middleware (validates Clerk JWT, attaches `req.user`)
- [ ] 🔴 Create `requireRole('elder')` middleware — blocks non-elder tokens from elder routes
- [ ] 🟡 Create `requireElderOwnership` middleware — confirms `elders.user_id = req.user.id`
- [ ] 🟢 Write unit tests for auth middleware with elder role fixture

### 0.3 Shared Utilities
- [ ] 🟢 Create `db.ts` / `db.js` — connection pool wrapper (pg / Drizzle / Prisma)
- [ ] 🟢 Create `asyncHandler` wrapper for Express route error propagation
- [ ] 🟢 Create standard API response shape: `{ success, data, error, meta }`
- [ ] 🟢 Create `NotFoundError`, `ForbiddenError`, `ValidationError` custom error classes

---

## PHASE 1 — Elder Profile

> Powers the **Welcome Header** (Section 1) — greeting, name, current care status label.

### 1.1 GET `/elder/profile`
- [ ] 🔴 Route: `GET /api/elder/profile`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Query: JOIN `users` + `elders` on `users.id = elders.user_id` WHERE `users.id = req.user.id`
- [ ] 🟡 Return fields:
  - `id`, `name`, `email` (from `users`)
  - `date_of_birth`, `mobility_level`, `preferred_languages`
  - `medical_notes`, `allergies`, `home_address`, `home_lat`, `home_lng`
- [ ] 🟢 Copilot prompt hint: *"Generate a SELECT query joining users and elders tables filtering by clerk user id"*
- [ ] 🟢 Handle edge case: user exists in `users` but no matching row in `elders` → return 404 with clear message

### 1.2 PATCH `/elder/profile`
- [ ] 🟡 Route: `PATCH /api/elder/profile`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')` + `requireElderOwnership`
- [ ] 🟡 Allowed update fields: `home_address`, `home_lat`, `home_lng`, `preferred_languages`
- [ ] 🟡 Block updates to `medical_notes`, `allergies` (caregiver/admin only)
- [ ] 🟢 Input validation: lat/lng must be valid decimal ranges
- [ ] 🟢 Return updated elder profile on success

---

## PHASE 2 — Active Care Session (Current Care Status Card)

> Powers **Section 2 — Current Care Status Card**: caregiver name, care type, ETA, session status, simplified notes.

### 2.1 GET `/elder/session/active`
- [ ] 🔴 Route: `GET /api/elder/session/active`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Query: SELECT from `care_sessions` WHERE `elder_id = :elderId` AND `status IN ('arriving', 'checked_in', 'paused')` ORDER BY `scheduled_at DESC` LIMIT 1
- [ ] 🔴 JOIN `caregivers` + `users` (caregiver side) to get caregiver name
- [ ] 🟡 Return fields:
  - `session_id`, `care_type`, `status`
  - `caregiver_name`, `caregiver_id`
  - `scheduled_at`, `checked_in_at`, `duration_minutes`
  - `elder_lat`, `elder_lng`
- [ ] 🟡 Compute `elapsed_seconds` server-side from `checked_in_at` to `NOW()` (for timer sync)
- [ ] 🟡 Compute `estimated_end_time` = `checked_in_at + duration_minutes`
- [ ] 🟢 Return `null` data (not 404) when no active session — elder UI shows "No Active Session" card
- [ ] 🟢 Copilot prompt hint: *"Write a parameterized query to find active care sessions for an elder with caregiver user join"*

### 2.2 GET `/elder/session/active/notes`
- [ ] 🟡 Route: `GET /api/elder/session/active/notes`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Query: SELECT latest 5 rows from `session_notes` WHERE `session_id = :activeSessionId` ORDER BY `created_at DESC`
- [ ] 🟡 Return simplified caregiver notes (content + note_type + created_at)
- [ ] 🟢 Used for "simplified caregiver note" in the CareStatusCard component
- [ ] 🟢 Copilot prompt hint: *"Fetch last 5 session notes for a session ordered by newest first"*

### 2.3 Realtime Session Status Updates
- [ ] 🔴 Set up Supabase Realtime channel **or** Socket.io room `session:{sessionId}:elder`
- [ ] 🔴 Emit event `session_status_changed` when `care_sessions.status` changes
  - Payload: `{ sessionId, status, updatedAt }`
- [ ] 🟡 Emit event `caregiver_location_updated` when caregiver GPS changes
  - Payload: `{ sessionId, lat, lng, eta_minutes }`
- [ ] 🟡 Emit event `session_note_added` when new row inserted into `session_notes`
  - Payload: `{ sessionId, noteType, content, createdAt }`
- [ ] 🟢 Elder client subscribes on mount, unsubscribes on unmount
- [ ] 🟢 Copilot prompt hint: *"Create a Supabase Realtime subscription handler for care_sessions table changes filtered by elder_id"*

---

## PHASE 3 — SOS Emergency Button

> Powers **Section 3 — SOS Emergency Button**: one-tap emergency alert, confirmation state, notifies relatives.

### 3.1 POST `/elder/emergency/sos`
- [ ] 🔴 Route: `POST /api/elder/emergency/sos`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Body: `{ lat?, lng?, session_id? }`
- [ ] 🔴 Insert into `emergency_alerts`:
  - `elder_id`, `session_id` (nullable), `alert_type = 'sos'`, `lat`, `lng`, `created_at`
- [ ] 🔴 After insert: fetch all `elder_relative_links` WHERE `elder_id = :elderId`
- [ ] 🔴 For each linked relative: insert row into `notifications`
  - `user_id = relative.user_id`, `type = 'emergency'`
  - `title = 'SOS Alert'`, `body = '{elderName} has triggered an emergency SOS'`
  - `related_id = emergency_alerts.id`, `related_type = 'emergency_alert'`
- [ ] 🔴 Fire Expo Push Notification to each relative's device tokens (from `device_tokens` table)
- [ ] 🟡 Also notify assigned caregiver if active session exists (`session_id` provided)
- [ ] 🟡 Return: `{ alertId, message: 'Emergency alert sent', notifiedCount }`
- [ ] 🟢 Rate limit: max 3 SOS per elder per hour (prevent accidental spam)
- [ ] 🟢 Copilot prompt hint: *"Insert emergency alert, fetch relative device tokens, send Expo push notifications to all relatives"*

### 3.2 GET `/elder/emergency/sos/status/:alertId`
- [ ] 🟡 Route: `GET /api/elder/emergency/sos/status/:alertId`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')` + verify alert belongs to elder
- [ ] 🟡 Return: `{ alertId, acknowledged_at, acknowledged_by_name }`
- [ ] 🟢 Powers confirmation state: *"Your family has been notified"* + acknowledgement timestamp

### 3.3 Realtime SOS Acknowledgement Feed
- [ ] 🟡 Emit event `sos_acknowledged` on Socket.io / Realtime channel `elder:{elderId}`
  - Payload: `{ alertId, acknowledgedByName, acknowledgedAt }`
- [ ] 🟢 Elder UI transitions from pulsing SOS state → confirmed reassurance state on receipt

---

## PHASE 4 — Need Help Button

> Powers **Section 4 — Need Help Button**: non-emergency help request, notifies relatives with lower urgency.

### 4.1 POST `/elder/emergency/help`
- [ ] 🔴 Route: `POST /api/elder/emergency/help`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Body: `{ lat?, lng?, session_id? }`
- [ ] 🔴 Insert into `emergency_alerts` with `alert_type = 'need_help'`
- [ ] 🔴 Insert `notifications` for all linked relatives:
  - `type = 'emergency'`, `title = 'Help Request'`
  - `body = '{elderName} needs assistance'`
- [ ] 🟡 Send Expo Push Notifications to all relative device tokens
- [ ] 🟡 Send push notification to assigned caregiver if active session exists
- [ ] 🟡 Return: `{ alertId, message: 'Help request sent', notifiedCount }`
- [ ] 🟢 Rate limit: max 5 help requests per elder per hour
- [ ] 🟢 Copilot prompt hint: *"Reuse SOS logic but with alert_type 'need_help' and lower-priority push notification"*

### 4.2 Differentiate Push Notification Priority
- [ ] 🟡 SOS → Expo push with `priority: 'high'`, `sound: 'default'`, `badge: 1`
- [ ] 🟡 Need Help → Expo push with `priority: 'normal'`, `sound: 'default'`
- [ ] 🟢 Copilot prompt hint: *"Send high-priority Expo push notification with badge for SOS, normal priority for need-help"*

---

## PHASE 5 — Caregiver Information Card

> Powers **Section 5 — Caregiver Information Card**: caregiver name, care type, ETA, session status, quick contact.

### 5.1 GET `/elder/session/active/caregiver`
- [ ] 🔴 Route: `GET /api/elder/session/active/caregiver`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Query: SELECT from `care_sessions` JOIN `caregivers` JOIN `users` WHERE active session for elder
- [ ] 🔴 Return fields:
  - `caregiver_name`, `caregiver_id`
  - `care_type`, `status`
  - `current_lat`, `current_lng` (from `caregivers`)
  - `scheduled_at`, `checked_in_at`
- [ ] 🟡 Compute `eta_minutes` using straight-line distance or Google Maps Distance Matrix API
  - Use `caregivers.current_lat/lng` vs `elders.home_lat/lng`
  - Fall back to straight-line estimate if Maps API unavailable
- [ ] 🟢 Return `null` gracefully if no active session exists
- [ ] 🟢 Copilot prompt hint: *"Join care_sessions with caregivers and users to get active caregiver details for an elder"*

### 5.2 GET `/elder/session/active/eta`
- [ ] 🟡 Route: `GET /api/elder/session/active/eta`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Fetch live caregiver GPS from `caregivers.current_lat/lng`
- [ ] 🟡 Call Google Maps Distance Matrix API (or Haversine fallback) between caregiver and elder home
- [ ] 🟡 Return: `{ eta_minutes, distance_km, last_updated }`
- [ ] 🟢 Cache result for 30 seconds per session to avoid Maps API overuse
- [ ] 🟢 Copilot prompt hint: *"Calculate ETA using Google Maps Distance Matrix API between two lat/lng points with 30-second cache"*

---

## PHASE 6 — Relative Quick Contact

> Powers **Section 6 — Relative Quick Contact**: displays primary relative info, enables one-tap call placeholder.

### 6.1 GET `/elder/relatives`
- [ ] 🔴 Route: `GET /api/elder/relatives`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Query: SELECT from `elder_relative_links` JOIN `users` WHERE `elder_id = :elderId`
- [ ] 🔴 Return fields per relative: `user_id`, `name`, `email`, `relationship`, `is_primary`
- [ ] 🟡 Sort: primary contact first (`is_primary = true`)
- [ ] 🟢 Return minimum 1 relative (if none linked, return empty array — UI shows "No emergency contact added")
- [ ] 🟢 Copilot prompt hint: *"Query elder_relative_links joined with users table, ordering primary contact first"*

### 6.2 GET `/elder/emergency-contacts`
- [ ] 🟡 Route: `GET /api/elder/emergency-contacts`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Query: SELECT from `elder_emergency_contacts` WHERE `elder_id = :elderId` ORDER BY `is_primary DESC`
- [ ] 🟡 Return: `id`, `name`, `phone`, `relationship`, `is_primary`
- [ ] 🟢 Used as fallback contacts when linked relatives are unavailable

---

## PHASE 7 — Reassurance Status Messages

> Powers **Section 7 — Reassurance Status Messages**: rotating contextual status messages derived from live session state.

### 7.1 GET `/elder/status-summary`
- [ ] 🟡 Route: `GET /api/elder/status-summary`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Aggregate and return a single status object:
  ```json
  {
    "activeSession": { "status": "checked_in", "caregiverName": "Emma" },
    "lastNoteMessage": "Medication administered",
    "sosActive": false,
    "relativeOnline": false
  }
  ```
- [ ] 🟡 Drive message selection on the frontend:
  - `arriving` → *"Emma is on the way"*
  - `checked_in` → *"Your caregiver is with you"*
  - `null` session → *"No active session right now"*
- [ ] 🟢 This is a read-only aggregation endpoint — no writes
- [ ] 🟢 Copilot prompt hint: *"Create a summary endpoint that aggregates active session status, latest note, and SOS state for an elder"*

---

## PHASE 8 — Notifications & Push Tokens

> Required for all alert flows (SOS, Help, session updates).

### 8.1 POST `/elder/device-token`
- [ ] 🔴 Route: `POST /api/elder/device-token`
- [ ] 🔴 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🔴 Body: `{ token, platform }` (`ios` or `android`)
- [ ] 🔴 Upsert into `device_tokens` (`user_id`, `token`, `platform`) — use `ON CONFLICT (user_id, token) DO NOTHING`
- [ ] 🟢 Call this on every app launch (token can rotate)
- [ ] 🟢 Copilot prompt hint: *"Upsert a device push token for a user, ignoring duplicates"*

### 8.2 DELETE `/elder/device-token`
- [ ] 🟡 Route: `DELETE /api/elder/device-token`
- [ ] 🟡 Body: `{ token }`
- [ ] 🟡 Delete matching row from `device_tokens` WHERE `user_id = req.user.id AND token = :token`
- [ ] 🟢 Call on logout to stop notifications after sign-out

### 8.3 GET `/elder/notifications`
- [ ] 🟡 Route: `GET /api/elder/notifications`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Query `notifications` WHERE `user_id = req.user.id` ORDER BY `created_at DESC` LIMIT 20
- [ ] 🟢 Support `?unread_only=true` query param
- [ ] 🟢 Return: `id`, `title`, `body`, `type`, `is_read`, `created_at`, `related_id`, `related_type`

### 8.4 PATCH `/elder/notifications/:id/read`
- [ ] 🟢 Route: `PATCH /api/elder/notifications/:id/read`
- [ ] 🟢 Set `is_read = true` WHERE `id = :id AND user_id = req.user.id`

---

## PHASE 9 — Modal Overlay Backend Support

> Powers the 4 confirmation modals: SOS Confirmation, Help Request Confirmation, Emergency Alert Sent, Caregiver Arriving.

### 9.1 GET `/elder/emergency/active`
- [ ] 🟡 Route: `GET /api/elder/emergency/active`
- [ ] 🟡 Auth: `requireAuth` + `requireRole('elder')`
- [ ] 🟡 Query: SELECT from `emergency_alerts` WHERE `elder_id = :elderId AND acknowledged_at IS NULL` ORDER BY `created_at DESC` LIMIT 1
- [ ] 🟡 Return: `{ alertId, alertType, createdAt, acknowledged: false }` or `null`
- [ ] 🟢 Powers the "Emergency Alert Sent" modal persistent state — show as long as unacknowledged

### 9.2 Realtime Alert Acknowledgement
- [ ] 🟡 When a relative calls `PATCH /emergency-alerts/:id/acknowledge` (relative-side route):
  - Update `acknowledged_at` and `acknowledged_by_user_id` in `emergency_alerts`
  - Emit `alert_acknowledged` on Socket.io/Realtime channel `elder:{elderId}`
- [ ] 🟡 Elder client receives event → dismiss emergency modal → show reassurance banner
- [ ] 🟢 Copilot prompt hint: *"Emit a socket event to elder room when emergency alert is acknowledged by relative"*

---

## PHASE 10 — Session Lifecycle Hooks (Elder-Facing Read-Only)

> Elder cannot control sessions — but must receive realtime lifecycle events to update UI states.

### 10.1 Realtime Event: Caregiver Arriving
- [ ] 🔴 When caregiver-side sets session `status = 'arriving'`:
  - Emit to `elder:{elderId}` channel: `{ event: 'caregiver_arriving', caregiverName, eta_minutes }`
- [ ] 🔴 Elder UI transitions CareStatusCard to "Caregiver On The Way" state

### 10.2 Realtime Event: Caregiver Checked In
- [ ] 🔴 When `status = 'checked_in'`:
  - Emit to `elder:{elderId}`: `{ event: 'session_started', caregiverName, checkedInAt }`
- [ ] 🔴 Elder UI transitions to "Active Care In Progress" state + starts visible timer

### 10.3 Realtime Event: Session Paused
- [ ] 🟡 When `status = 'paused'`:
  - Emit: `{ event: 'session_paused', reason: null }`
- [ ] 🟡 Elder UI shows "Session Paused" badge

### 10.4 Realtime Event: Session Completed
- [ ] 🔴 When `status = 'completed'`:
  - Emit: `{ event: 'session_completed', completedAt }`
  - Send Expo push to elder: *"Your care session has ended"*
- [ ] 🔴 Elder UI transitions to "Session Completed" → then "No Active Session" after 10s

### 10.5 Realtime Event: Caregiver GPS Update
- [ ] 🟡 When caregiver updates GPS (from caregiver Active Session screen):
  - Emit to `elder:{elderId}`: `{ event: 'caregiver_location', lat, lng, eta_minutes }`
- [ ] 🟡 Elder UI refreshes ETA in CaregiverInfoCard

---

## PHASE 11 — Security & Validation

### 11.1 Input Validation
- [ ] 🔴 Apply `zod` or `joi` schema validation to all POST/PATCH body inputs
- [ ] 🔴 Validate lat/lng: `latitude BETWEEN -90 AND 90`, `longitude BETWEEN -180 AND 180`
- [ ] 🟡 Validate `alert_type` is strictly `'sos'` or `'need_help'`
- [ ] 🟡 Sanitize all text inputs against SQL injection (use parameterized queries throughout)

### 11.2 Authorization Checks
- [ ] 🔴 Every route that accepts `elderId` must verify `elders.user_id = req.user.id`
- [ ] 🔴 Elder cannot read another elder's session, notes, or alerts
- [ ] 🟡 Emergency alert `GET /status/:alertId` must verify `emergency_alerts.elder_id` matches

### 11.3 Rate Limiting
- [ ] 🟡 SOS: max 3 requests per elder per hour → `429 Too Many Requests`
- [ ] 🟡 Need Help: max 5 requests per elder per hour
- [ ] 🟢 Use `express-rate-limit` with Redis store (or in-memory for dev)

---

## PHASE 12 — Testing

### 12.1 Unit Tests
- [ ] 🟡 Test `requireRole('elder')` middleware rejects non-elder tokens
- [ ] 🟡 Test `POST /elder/emergency/sos` inserts correct row and fires push
- [ ] 🟡 Test `GET /elder/session/active` returns null when no active session
- [ ] 🟢 Test rate limiter blocks after threshold

### 12.2 Integration Tests
- [ ] 🟡 Full flow: active session → caregiver status change → elder realtime event received
- [ ] 🟡 SOS flow: elder taps SOS → alert inserted → relatives notified → acknowledgement → elder confirmation state
- [ ] 🟢 Copilot prompt hint: *"Write a supertest integration test for POST /elder/emergency/sos that mocks Expo push and verifies database insert"*

### 12.3 Manual QA Checklist
- [ ] 🟢 Elder profile loads correctly for a seeded elder user
- [ ] 🟢 Active session card shows correct caregiver + status when session is `checked_in`
- [ ] 🟢 SOS push notification received on relative device within 5 seconds
- [ ] 🟢 Need Help notification received on relative device
- [ ] 🟢 Session completion event clears active session card
- [ ] 🟢 No elder data leaks across different elder accounts

---

## PHASE 13 — API Route Summary Reference

| Method | Route | Section | Priority |
|--------|-------|---------|----------|
| GET | `/api/elder/profile` | Welcome Header | 🔴 |
| PATCH | `/api/elder/profile` | Profile editing | 🟡 |
| GET | `/api/elder/session/active` | Care Status Card | 🔴 |
| GET | `/api/elder/session/active/notes` | Care Status Card | 🟡 |
| GET | `/api/elder/session/active/caregiver` | Caregiver Info Card | 🔴 |
| GET | `/api/elder/session/active/eta` | Caregiver Info Card | 🟡 |
| POST | `/api/elder/emergency/sos` | SOS Button | 🔴 |
| GET | `/api/elder/emergency/sos/status/:id` | SOS Confirmation Modal | 🟡 |
| POST | `/api/elder/emergency/help` | Need Help Button | 🔴 |
| GET | `/api/elder/emergency/active` | Modal persistence | 🟡 |
| GET | `/api/elder/relatives` | Relative Contact | 🔴 |
| GET | `/api/elder/emergency-contacts` | Relative Contact | 🟡 |
| GET | `/api/elder/status-summary` | Reassurance Messages | 🟡 |
| GET | `/api/elder/notifications` | Notification feed | 🟡 |
| PATCH | `/api/elder/notifications/:id/read` | Notification read | 🟢 |
| POST | `/api/elder/device-token` | Push setup | 🔴 |
| DELETE | `/api/elder/device-token` | Push cleanup | 🟡 |

---

## PHASE 14 — Copilot Workflow Tips

> Paste these directly into GitHub Copilot Chat for fast scaffolding.

```
// Tip 1 — Elder profile endpoint
"Generate an Express route GET /api/elder/profile that uses a parameterized 
pg query to join users and elders tables on user_id, filtered by clerk_id 
from the JWT, returning profile fields including mobility_level and allergies"

// Tip 2 — Active session fetch
"Write a TypeScript async function getActiveSessionForElder(elderId: number) 
that queries care_sessions joined with caregivers and users where status is 
in ['arriving','checked_in','paused'], returns null if none found"

// Tip 3 — SOS with push notifications
"Create an Express POST handler for /elder/emergency/sos that: 
1) inserts into emergency_alerts, 
2) queries elder_relative_links for all relatives, 
3) fetches device_tokens for each relative, 
4) sends Expo push notifications using expo-server-sdk"

// Tip 4 — Realtime emission helper
"Write a helper emitToElder(elderId, event, payload) that emits a 
Socket.io event to room 'elder:{elderId}' and also handles 
Supabase Realtime broadcast as a fallback"

// Tip 5 — Rate limiter for SOS
"Create an express-rate-limit configuration that limits POST /elder/emergency/sos 
to 3 requests per elderId per hour using a Redis store key of 'sos:{elderId}'"
```

---

*Last updated: CareBridge Elder Backend TODO v1.0*
