### Chat Screen
25. [hooks/useConversations.ts](#25-hooksuseconversations)
26. [hooks/useMessages.ts](#26-hooksusemessages)
27. [hooks/useSendMessage.ts](#27-hooksusesendmessage)
28. [hooks/useUnreadCount.ts](#28-hooksuserealtimeunreadcount)

### Session History Screen
29. [hooks/useSessionHistory.ts](#29-hooksusesessionhistory)
30. [hooks/useSessionCounts.ts](#30-hooksusesessioncounts)
31. [hooks/useEarnings.ts](#31-hooksuseearnings)
32. [hooks/useWeeklyBreakdown.ts](#32-hooksuseweeklybreakdown)
33. [hooks/useMonthlyBreakdown.ts](#33-hooksusemonthlybreakdown)
34. [hooks/useEarningsHistory.ts](#34-hooksuseearningshistory)
35. [hooks/useAnalytics.ts](#35-hooksuseanalytics)



##### 

##### **\#\#\# Chat Screen**

##### **25\. \[hooks/useConversations.ts\](\#25-hooksuseconversations)**

##### **26\. \[hooks/useMessages.ts\](\#26-hooksusemessages)**

##### **27\. \[hooks/useSendMessage.ts\](\#27-hooksusesendmessage)**

##### **28\. \[hooks/useUnreadCount.ts\](\#28-hooksuserealtimeunreadcount)**

##### 

##### **\#\#\# Session History Screen**

##### **29\. \[hooks/useSessionHistory.ts\](\#29-hooksusesessionhistory)**

##### **30\. \[hooks/useSessionCounts.ts\](\#30-hooksusesessioncounts)**

##### **31\. \[hooks/useEarnings.ts\](\#31-hooksuseearnings)**

##### **32\. \[hooks/useWeeklyBreakdown.ts\](\#32-hooksuseweeklybreakdown)**

##### **33\. \[hooks/useMonthlyBreakdown.ts\](\#33-hooksusemonthlybreakdown)**

##### **34\. \[hooks/useEarningsHistory.ts\](\#34-hooksuseearningshistory)**

##### **35\. \[hooks/useAnalytics.ts\](\#35-hooksuseanalytics)**



\# HOME SCREEN

\---

\#\# 8\. hooks/useCaregiver.ts

\`\`\`ts  
/\*  
  FILE: hooks/useCaregiver.ts  
  PURPOSE: React Query hook for fetching and caching the authenticated  
           caregiver's profile. Powers the Home header, Profile header,  
           and availability toggle. Writes result into caregiverStore.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery }          from '@tanstack/react-query'  
  import { fetchAPI }          from '@/lib/fetch'  
  import { useCaregiverStore } from '@/store/caregiverStore'  
  import type { CaregiverProfile } from '@/store/caregiverStore'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useCaregiver() {  
    const setProfile \= useCaregiverStore(s \=\> s.setProfile)

    const query \= useQuery({  
      queryKey: \['caregiver', 'me'\],  
      queryFn:  async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me')  
        const profile: CaregiverProfile \= res.data  
        setProfile(profile)       // sync into Zustand store  
        return profile  
      },  
      staleTime: 5 \* 60 \* 1000,  // 5 minutes — profile rarely changes  
      retry: 2,  
    })

    return {  
      caregiver:  query.data ?? useCaregiverStore.getState().profile,  
      isLoading:  query.isLoading,  
      isError:    query.isError,  
      refetch:    query.refetch,  
    }  
  }

  Return the Zustand store value as a fallback when query.data is  
  undefined — this provides instant data from the persist cache while  
  the network request is in flight.

  ── API ENDPOINT ───────────────────────────────────────────────────────────  
  GET /api/caregivers/me  
  Response: { success: true, data: CaregiverProfile }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- staleTime of 5 minutes prevents re-fetching on every tab switch  
  \- Do NOT call this hook more than once per screen — it is cached,  
    but multiple instances still generate multiple React Query entries  
  \- The Zustand store fallback must use getState() not useStore() to  
    avoid creating a reactive dependency inside a non-hook context  
\*/  
\`\`\`

\---

\#\# 9\. hooks/useToggleAvailability.ts

\`\`\`ts  
/\*  
  FILE: hooks/useToggleAvailability.ts  
  PURPOSE: React Query mutation for toggling the caregiver's  
           is\_available boolean. Applies optimistic update immediately,  
           syncs Zustand store on success, rolls back on error.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useCaregiverStore }           from '@/store/caregiverStore'  
  import { Alert }                       from 'react-native'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useToggleAvailability() {  
    const queryClient      \= useQueryClient()  
    const setAvailability  \= useCaregiverStore(s \=\> s.setAvailability)  
    const currentProfile   \= useCaregiverStore(s \=\> s.profile)

    return useMutation({  
      // No variables needed — the server flips the current value  
      mutationFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/availability', {  
          method: 'PATCH',  
        })  
        return res.data as { caregiver\_id: number; is\_available: boolean; updated\_at: string }  
      },

      // OPTIMISTIC UPDATE — flip before network call returns  
      onMutate: async () \=\> {  
        // Snapshot previous value for rollback  
        const previousValue \= currentProfile?.is\_available ?? false

        // Apply optimistic flip in Zustand store immediately  
        setAvailability(\!previousValue)

        // Cancel any in-flight refetches that would overwrite optimistic state  
        await queryClient.cancelQueries({ queryKey: \['caregiver', 'me'\] })

        return { previousValue }  
      },

      // ON SUCCESS — sync with confirmed server value  
      onSuccess: (data) \=\> {  
        setAvailability(data.is\_available)  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'me'\] })  
      },

      // ON ERROR — roll back to the previous value  
      onError: (\_error, \_variables, context) \=\> {  
        if (context?.previousValue \!== undefined) {  
          setAvailability(context.previousValue)  
        }  
        Alert.alert(  
          'Could not update availability',  
          'Please check your connection and try again.'  
        )  
      },  
    })  
  }

  ── API ENDPOINT ───────────────────────────────────────────────────────────  
  PATCH /api/caregivers/me/availability  
  No request body needed — server flips the current value atomically.  
  Response: { success: true, data: { caregiver\_id, is\_available, updated\_at } }

  ── WIRING IN HOME SCREEN ──────────────────────────────────────────────────  
  const { mutate: toggleAvailability, isPending } \= useToggleAvailability()  
  // Wire to the availability toggle switch:  
  \<Switch  
    value={caregiver?.is\_available ?? false}  
    onValueChange={() \=\> toggleAvailability()}  
    disabled={isPending}  
  /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- cancelQueries is required before the optimistic update — without it,  
    a background refetch can overwrite the optimistic state mid-flight  
  \- The rollback in onError must restore the original value, not \!currentValue  
    (the current value may have already been flipped by onMutate)  
  \- Do NOT pass the expected new value to the server — the server owns  
    the toggle logic via NOT is\_available  
\*/  
\`\`\`

\---

\#\# 10\. hooks/useNearbyRequests.ts

\`\`\`ts  
/\*  
  FILE: hooks/useNearbyRequests.ts  
  PURPOSE: Fetches pending booking requests near the caregiver.  
           Auto-refetches every 30 seconds. Also exports accept and  
           decline mutation hooks.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                              from '@/lib/fetch'  
  import { useActiveSessionStore }                 from '@/store/activeSessionStore'  
  import { Alert }                                 from 'react-native'

  ── WHAT TO GENERATE — 3 HOOKS IN ONE FILE ─────────────────────────────────

  HOOK 1 — useNearbyRequests()  
    queryKey:    \['caregiver', 'requests'\]  
    queryFn:     GET /api/caregivers/me/requests  
    refetchInterval: 30\_000   (30 seconds)  
    staleTime:   20\_000       (20 seconds)

    Return: { requests, isLoading, isError, refetch }  
    requests \= res.data as RequestRow\[\]

    type RequestRow \= {  
      id:            number  
      elder\_name:    string  
      care\_type:     string  
      scheduled\_at:  string  
      duration\_minutes: number  
      status:        string  
      estimated\_pay: number  
      distance\_km:   number | null  
    }

  HOOK 2 — useAcceptRequest()  
    mutationFn:   POST /api/care-sessions/:id/accept   (no body)  
    onSuccess:  
      \- Invalidate \['caregiver', 'requests'\] query  
      \- Invalidate \['caregiver', 'active-session'\] query  
      \- Invalidate \['caregiver', 'schedule'\] query  
      \- Show a success toast: 'Booking accepted'  
    onError:  
      \- Alert.alert('Could not accept booking', 'Please try again.')

    Return: { acceptRequest: mutate, isAccepting: isPending }

    Usage: acceptRequest(sessionId)   ← sessionId is the mutation variable

  HOOK 3 — useDeclineRequest()  
    mutationFn:   POST /api/care-sessions/:id/decline  (no body)  
    onMutate:     Optimistically remove the request from the query cache  
      queryClient.setQueryData(\['caregiver', 'requests'\], (old: RequestRow\[\] | undefined) \=\>  
        (old ?? \[\]).filter(r \=\> r.id \!== sessionId)  
      )  
    onSuccess:    Invalidate \['caregiver', 'requests'\] to confirm removal  
    onError:      Roll back (invalidate to restore from server),  
                  Alert.alert('Could not decline booking', 'Please try again.')

    Return: { declineRequest: mutate, isDeclining: isPending }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Do NOT use refetchInterval when the app is in the background —  
    set refetchIntervalInBackground: false on useNearbyRequests  
  \- The optimistic removal in useDeclineRequest onMutate is applied  
    before the network call to make the UI feel instant  
  \- mutationFn for both accept and decline receives sessionId as  
    the single variable argument  
\*/  
\`\`\` 

\#\# 11\. hooks/useActiveSession.ts

\`\`\`ts  
/\*  
  FILE: hooks/useActiveSession.ts  
  PURPOSE: Fetches the caregiver's current active session (if any).  
           Polls every 15s while status is arriving or checked\_in.  
           Writes into activeSessionStore.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery }              from '@tanstack/react-query'  
  import { fetchAPI }              from '@/lib/fetch'  
  import { useActiveSessionStore } from '@/store/activeSessionStore'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useActiveSession() {  
    const setSession \= useActiveSessionStore(s \=\> s.setSession)

    const query \= useQuery({  
      queryKey: \['caregiver', 'active-session'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/active-session')  
        // API returns 204 No Content when no active session  
        if (\!res || \!res.data) {  
          useActiveSessionStore.getState().clearSession()  
          return null  
        }  
        setSession(res.data)  
        return res.data  
      },  
      refetchInterval: (data) \=\> {  
        // Poll every 15s if session is in an active state  
        if (\!data) return false  
        const activeStatuses \= \['arriving', 'checked\_in', 'accepted'\]  
        return activeStatuses.includes(data.status) ? 15\_000 : false  
      },  
      refetchIntervalInBackground: false,  
      staleTime: 10\_000,  
    })

    return {  
      activeSession: query.data,  
      hasActiveSession: \!\!query.data,  
      isLoading: query.isLoading,  
      refetch: query.refetch,  
    }  
  }

  ── API ENDPOINT ───────────────────────────────────────────────────────────  
  GET /api/caregivers/me/active-session  
  Response when active:    { success: true, data: { sessionId, status, ... } }  
  Response when none:      204 No Content  (fetchAPI returns undefined/null)

  ── WIRING IN HOME SCREEN ──────────────────────────────────────────────────  
  const { activeSession, hasActiveSession, isLoading } \= useActiveSession()  
  // Conditionally render:  
  if (\!hasActiveSession) return \<NoActiveSessionCard /\>  
  return \<ActiveSessionCard session={activeSession} /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Handle the 204 case explicitly — fetchAPI may return undefined when  
    the server sends No Content. Do NOT assume res.data always exists.  
  \- clearSession() must be called when the response is null so the  
    Home card shows the empty state instead of stale session data  
  \- refetchInterval must be a function (not a number) so it can pause  
    polling once the session reaches 'completed'  
\*/  
\`\`\`

\---

\#\# 12\. hooks/useTodaySchedule.ts

\`\`\`ts  
/\*  
  FILE: hooks/useTodaySchedule.ts  
  PURPOSE: Fetches the caregiver's sessions for today's schedule list  
           on the Home screen.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery } from '@tanstack/react-query'  
  import { fetchAPI } from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useTodaySchedule() {  
    // Get today's date in YYYY-MM-DD format  
    const today \= new Date().toISOString().split('T')\[0\]

    const query \= useQuery({  
      queryKey: \['caregiver', 'schedule', today\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/caregivers/me/schedule?date=${today}\`)  
        return res.data as ScheduleItem\[\]  
      },  
      staleTime: 60\_000,   // 60s cache — schedule changes infrequently  
    })

    return {  
      schedule:  query.data ?? \[\],  
      isLoading: query.isLoading,  
      refetch:   query.refetch,  
    }  
  }

  type ScheduleItem \= {  
    id:               number  
    care\_type:        string  
    status:           string  
    scheduled\_at:     string  
    duration\_minutes: number  
    elder\_name:       string  
  }

  ── WIRING IN HOME SCREEN ──────────────────────────────────────────────────  
  const { schedule, isLoading } \= useTodaySchedule()  
  // Each schedule row:  
  // Pressing a row → router.push(\`/(root)/(tabs)/caregiver/active-session?id=${item.id}\`)

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Include today's date in the queryKey so the cache invalidates at  
    midnight when the date changes (new Date() on mount handles this)  
  \- Return empty array \[\] as the default — not null — so the UI can  
    map over the result without a null check  
\*/  
\`\`\`

\---

\# ACTIVE SESSION SCREEN

\---

\#\# 13\. hooks/useSessionDetail.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionDetail.ts  
  PURPOSE: Fetches the full session detail for the Active Session screen.  
           Powers SessionHeader, ElderInfoCard, SessionMap initialisation,  
           and emergency contacts list.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery }              from '@tanstack/react-query'  
  import { fetchAPI }              from '@/lib/fetch'  
  import { useActiveSessionStore } from '@/store/activeSessionStore'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionDetail(sessionId: number | null) {  
    const setSession \= useActiveSessionStore(s \=\> s.setSession)

    const query \= useQuery({  
      queryKey: \['session', sessionId, 'detail'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}\`)  
        const data \= res.data  
        // Sync relevant fields into activeSessionStore  
        setSession({  
          sessionId:       data.session.id,  
          status:          data.session.status,  
          care\_type:       data.session.care\_type,  
          elder\_name:      data.elder.name,  
          elder\_id:        data.elder.id,  
          checked\_in\_at:   data.session.checked\_in\_at,  
          scheduled\_at:    data.session.scheduled\_at,  
          duration\_minutes: data.session.duration\_minutes,  
          elder\_lat:       data.session.elder\_lat,  
          elder\_lng:       data.session.elder\_lng,  
        })  
        return data  
      },  
      enabled: \!\!sessionId,  
      staleTime: 30\_000,  
    })

    return {  
      session:            query.data?.session    ?? null,  
      elder:              query.data?.elder      ?? null,  
      emergencyContacts:  query.data?.emergency\_contacts ?? \[\],  
      caregiverLocation:  query.data?.caregiver\_location ?? { lat: null, lng: null },  
      isLoading:          query.isLoading,  
      isError:            query.isError,  
      refetch:            query.refetch,  
    }  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  // Read sessionId from Expo Router params:  
  const { id } \= useLocalSearchParams\<{ id: string }\>()  
  const sessionId \= id ? parseInt(id, 10\) : null

  const { session, elder, emergencyContacts, caregiverLocation, isLoading }  
    \= useSessionDetail(sessionId)

  // Allergy warning card: show if elder?.allergies is not null  
  // Emergency contacts list: map emergencyContacts array

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- enabled: \!\!sessionId prevents the query from firing when sessionId  
    is null (e.g. when navigating away from the screen)  
  \- setSession sync must happen inside queryFn — not in a useEffect —  
    to avoid a render cycle where the store is empty for one frame  
\*/  
\`\`\`

\---

\#\# 14\. hooks/useCheckIn.ts

\`\`\`ts  
/\*  
  FILE: hooks/useCheckIn.ts  
  PURPOSE: Mutation hook for session check-in. Reads device GPS,  
           sends location to the API, seeds tasks on success.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useActiveSessionStore }       from '@/store/activeSessionStore'  
  import { useTaskStore }                from '@/store/taskStore'  
  import \* as Location                   from 'expo-location'  
  import { Alert }                       from 'react-native'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useCheckIn(sessionId: number) {  
    const queryClient \= useQueryClient()  
    const setStatus   \= useActiveSessionStore(s \=\> s.setStatus)

    return useMutation({  
      mutationFn: async () \=\> {  
        // STEP 1: Request and get current GPS location  
        const { status } \= await Location.requestForegroundPermissionsAsync()  
        if (status \!== 'granted') {  
          throw new Error('Location permission denied. Enable location to check in.')  
        }  
        const location \= await Location.getCurrentPositionAsync({  
          accuracy: Location.Accuracy.High,  
        })

        // STEP 2: Send check-in request with coordinates  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/check-in\`, {  
          method: 'POST',  
          body: JSON.stringify({  
            lat: location.coords.latitude,  
            lng: location.coords.longitude,  
          }),  
        })  
        return res.data as {  
          session\_id:    number  
          status:        string  
          checked\_in\_at: string  
          tasks\_seeded:  number  
        }  
      },

      onSuccess: (data) \=\> {  
        // Update session status in store  
        setStatus('checked\_in')  
        useActiveSessionStore.setState({ checked\_in\_at: data.checked\_in\_at })

        // Invalidate queries so fresh data loads  
        queryClient.invalidateQueries({ queryKey: \['session', sessionId, 'detail'\] })  
        queryClient.invalidateQueries({ queryKey: \['session', sessionId, 'tasks'\] })  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'active-session'\] })

        Alert.alert('Checked In', \`Session started — ${data.tasks\_seeded} tasks ready.\`)  
      },

      onError: (error: Error) \=\> {  
        // Handle GPS proximity failure (API returns 422\)  
        if (error.message.includes('500m') || error.message.includes('distance')) {  
          Alert.alert(  
            'Too far from elder',  
            error.message  
          )  
        } else {  
          Alert.alert('Check-In Failed', error.message)  
        }  
      },  
    })  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  const { mutate: checkIn, isPending: isCheckingIn } \= useCheckIn(sessionId\!)  
  // Wire to Check In button:  
  \<Button title="Check In" onPress={() \=\> checkIn()} loading={isCheckingIn} /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Location.requestForegroundPermissionsAsync() must be called inside  
    the mutationFn — not at hook init — so it triggers on button tap  
  \- The 422 distance error comes as Error.message from fetchAPI —  
    parse the message text to detect it rather than checking status codes  
  \- Do NOT hardcode 500m in the error message — read it from the server  
    response which is already formatted by the API  
\*/  
\`\`\`

\---

\#\# 15\. hooks/useCheckOut.ts

\`\`\`ts  
/\*  
  FILE: hooks/useCheckOut.ts  
  PURPOSE: Mutation hook for session check-out. Computes duration and  
           cost on the server. Navigates to Home on success.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useActiveSessionStore }       from '@/store/activeSessionStore'  
  import { router }                      from 'expo-router'  
  import { Alert }                       from 'react-native'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useCheckOut(sessionId: number) {  
    const queryClient \= useQueryClient()  
    const clearSession \= useActiveSessionStore(s \=\> s.clearSession)

    const mutation \= useMutation({  
      mutationFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/check-out\`, {  
          method: 'POST',  
        })  
        return res.data as {  
          session\_id:              number  
          status:                  string  
          checked\_out\_at:          string  
          actual\_duration\_minutes: number  
          total\_cost:              number  
          payment\_id:              number  
        }  
      },

      onSuccess: (data) \=\> {  
        clearSession()  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'sessions'\] })  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'schedule'\] })  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'active-session'\] })  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'requests'\] })

        const cost \= data.total\_cost.toFixed(2)  
        Alert.alert(  
          'Session Complete',  
          \`Great work\! Session total: $${cost}\`,  
          \[{ text: 'Done', onPress: () \=\> router.replace('/(root)/(tabs)/caregiver/home') }\]  
        )  
      },

      onError: (error: Error) \=\> {  
        Alert.alert('Check-Out Failed', error.message)  
      },  
    })

    // Wrap mutate with a confirmation dialog  
    function confirmCheckOut() {  
      Alert.alert(  
        'Check Out',  
        'Are you sure you want to end this session?',  
        \[  
          { text: 'Cancel', style: 'cancel' },  
          { text: 'Check Out', style: 'destructive', onPress: () \=\> mutation.mutate() },  
        \]  
      )  
    }

    return {  
      confirmCheckOut,  
      isCheckingOut: mutation.isPending,  
    }  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- The confirmation dialog wraps mutate() — the component calls  
    confirmCheckOut(), not mutation.mutate() directly  
  \- router.replace() is used (not push) so the caregiver cannot  
    navigate back to a completed session via the back button  
  \- clearSession() must be called BEFORE navigation so the Home  
    screen renders the empty state immediately on arrival  
\*/  
\`\`\`

\---

\#\# 16\. hooks/useUpdateSessionStatus.ts

\`\`\`ts  
/\*  
  FILE: hooks/useUpdateSessionStatus.ts  
  PURPOSE: Mutation for Pause / Resume / Arriving status transitions.  
           Applies optimistic update in the store, validates the  
           transition, rolls back on error.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useActiveSessionStore }       from '@/store/activeSessionStore'  
  import { Alert }                       from 'react-native'

  type AllowedStatus \= 'arriving' | 'paused' | 'checked\_in'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useUpdateSessionStatus(sessionId: number) {  
    const queryClient \= useQueryClient()  
    const setStatus   \= useActiveSessionStore(s \=\> s.setStatus)  
    const currentStatus \= useActiveSessionStore(s \=\> s.status)

    return useMutation({  
      mutationFn: async (targetStatus: AllowedStatus) \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/status\`, {  
          method: 'PATCH',  
          body: JSON.stringify({ status: targetStatus }),  
        })  
        return res.data as { session\_id: number; status: string; updated\_at: string }  
      },

      onMutate: async (targetStatus) \=\> {  
        const previousStatus \= currentStatus  
        // Apply optimistic transition  
        setStatus(targetStatus)  
        await queryClient.cancelQueries({ queryKey: \['session', sessionId, 'detail'\] })  
        return { previousStatus }  
      },

      onSuccess: (data) \=\> {  
        setStatus(data.status as AllowedStatus)  
        queryClient.invalidateQueries({ queryKey: \['session', sessionId, 'detail'\] })  
      },

      onError: (\_error, \_targetStatus, context) \=\> {  
        // Roll back to pre-mutation status  
        if (context?.previousStatus) {  
          setStatus(context.previousStatus as AllowedStatus)  
        }  
        Alert.alert('Status Update Failed', 'Could not update session status. Please try again.')  
      },  
    })  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  const { mutate: updateStatus, isPending } \= useUpdateSessionStatus(sessionId\!)  
  // Pause button: \<Button onPress={() \=\> updateStatus('paused')} /\>  
  // Resume button: \<Button onPress={() \=\> updateStatus('checked\_in')} /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- The server enforces the state machine — the client does not need  
    to validate allowed transitions (the API returns 422 on invalid ones)  
  \- Rollback uses the captured previousStatus from onMutate context,  
    not the current store value (which may already be the optimistic value)  
\*/  
\`\`\`

\---

\#\# 17\. hooks/useSessionTasks.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionTasks.ts  
  PURPOSE: Fetches the task checklist for a session and writes into  
           taskStore. Returns live progress data.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery }    from '@tanstack/react-query'  
  import { fetchAPI }    from '@/lib/fetch'  
  import { useTaskStore } from '@/store/taskStore'  
  import type { SessionTask } from '@/types/db'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionTasks(sessionId: number | null) {  
    const setTasks       \= useTaskStore(s \=\> s.setTasks)  
    const getCompleted   \= useTaskStore(s \=\> s.getCompletedCount)  
    const getProgress    \= useTaskStore(s \=\> s.getProgressPct)  
    const tasks          \= useTaskStore(s \=\> sessionId ? s.tasksBySession\[sessionId\] : \[\])

    const query \= useQuery({  
      queryKey: \['session', sessionId, 'tasks'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/tasks\`)  
        const fetchedTasks: SessionTask\[\] \= res.data.tasks  
        setTasks(sessionId\!, fetchedTasks)  
        return res.data  
      },  
      enabled: \!\!sessionId,  
      staleTime: 60\_000,  
    })

    return {  
      tasks:          tasks ?? \[\],  
      total:          tasks?.length ?? 0,  
      completedCount: sessionId ? getCompleted(sessionId) : 0,  
      progressPct:    sessionId ? getProgress(sessionId) : 0,  
      isLoading:      query.isLoading,  
      refetch:        query.refetch,  
    }  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Return tasks from taskStore, not from query.data — the store is the  
    single source of truth after the initial fetch and subsequent toggles  
  \- progressPct is computed from the store (which is updated optimistically  
    on toggle) NOT from query.data.progress\_pct (which is stale)  
\*/  
\`\`\`

\---

\#\# 18\. hooks/useToggleTask.ts

\`\`\`ts  
/\*  
  FILE: hooks/useToggleTask.ts  
  PURPOSE: Mutation for checking/unchecking a task. Optimistic update  
           in taskStore, auto-inserts care\_update chat message server-side.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation }   from '@tanstack/react-query'  
  import { fetchAPI }      from '@/lib/fetch'  
  import { useTaskStore }  from '@/store/taskStore'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useToggleTask(sessionId: number) {  
    const toggleTask \= useTaskStore(s \=\> s.toggleTask)

    return useMutation({  
      mutationFn: async ({  
        taskId,  
        is\_completed,  
        notes,  
      }: {  
        taskId:       number  
        is\_completed: boolean  
        notes?:       string | null  
      }) \=\> {  
        const res \= await fetchAPI(\`/api/session-tasks/${taskId}\`, {  
          method: 'PATCH',  
          body: JSON.stringify({ is\_completed, notes }),  
        })  
        return res.data.task  
      },

      onMutate: async ({ taskId, is\_completed }) \=\> {  
        const completed\_at \= is\_completed ? new Date().toISOString() : null  
        // Optimistic update — show checkmark immediately  
        toggleTask(sessionId, taskId, is\_completed, completed\_at)  
      },

      onSuccess: (updatedTask) \=\> {  
        // Sync confirmed completed\_at from server  
        toggleTask(sessionId, updatedTask.id, updatedTask.is\_completed, updatedTask.completed\_at)  
      },

      onError: (\_error, { taskId, is\_completed }) \=\> {  
        // Roll back the optimistic toggle  
        toggleTask(sessionId, taskId, \!is\_completed, null)  
      },  
    })  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  const { mutate: toggleTask } \= useToggleTask(sessionId\!)  
  // Each task row checkbox:  
  // onPress={() \=\> toggleTask({ taskId: task.id, is\_completed: \!task.is\_completed })}

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- The care\_update chat message is auto-inserted server-side on completion  
    — do NOT insert it from the client  
  \- Roll back in onError must use \!is\_completed (the original value before  
    the optimistic toggle was applied)  
  \- completed\_at in onMutate is a client-side approximation — the server's  
    confirmed value from onSuccess replaces it  
\*/  
\`\`\`

\---

\#\# 19\. hooks/useAddTask.ts

\`\`\`ts  
/\*  
  FILE: hooks/useAddTask.ts  
  PURPOSE: Mutation for adding a custom task mid-session.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useTaskStore }                from '@/store/taskStore'  
  import type { SessionTask }            from '@/types/db'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useAddTask(sessionId: number) {  
    const queryClient \= useQueryClient()  
    const addTask     \= useTaskStore(s \=\> s.addTask)

    return useMutation({  
      mutationFn: async (task\_name: string) \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/tasks\`, {  
          method: 'POST',  
          body: JSON.stringify({ task\_name: task\_name.trim() }),  
        })  
        return res.data.task as SessionTask  
      },

      onMutate: async (task\_name) \=\> {  
        // Optimistic insert with a temporary negative ID  
        const tempTask: SessionTask \= {  
          id:           \-Date.now(),   // temporary — replaced on success  
          session\_id:   sessionId,  
          task\_name:    task\_name.trim(),  
          is\_completed: false,  
          notes:        null,  
          is\_custom:    true,  
          sort\_order:   999,  
          completed\_at: null,  
          created\_at:   new Date().toISOString(),  
        }  
        addTask(sessionId, tempTask)  
        return { tempId: tempTask.id }  
      },

      onSuccess: (confirmedTask, \_taskName, context) \=\> {  
        // Remove the temp task and add the server-confirmed one  
        const tasks \= useTaskStore.getState().tasksBySession\[sessionId\] ?? \[\]  
        const updated \= tasks  
          .filter(t \=\> t.id \!== context?.tempId)  
          .concat(confirmedTask)  
        useTaskStore.getState().setTasks(sessionId, updated)  
      },

      onError: (\_error, \_taskName, context) \=\> {  
        // Remove the optimistic temp task  
        const tasks \= useTaskStore.getState().tasksBySession\[sessionId\] ?? \[\]  
        const rolled \= tasks.filter(t \=\> t.id \!== context?.tempId)  
        useTaskStore.getState().setTasks(sessionId, rolled)  
      },  
    })  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Temporary IDs use negative timestamps to avoid collisions with real  
    SERIAL IDs (which are always positive)  
  \- sort\_order 999 places the optimistic task at the bottom of the list  
    — the server-confirmed sort\_order replaces it on success  
  \- task\_name must be trimmed before sending — the API also trims, but  
    trimming client-side avoids UI flicker with leading/trailing spaces  
\*/  
\`\`\`

\---

\#\# 20\. hooks/useSessionNotes.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionNotes.ts  
  PURPOSE: Fetches session notes for the Session Notes section and  
           subscribes to realtime note\_added events.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useQueryClient }  from '@tanstack/react-query'  
  import { fetchAPI }                  from '@/lib/fetch'  
  import { useRealtimeChannel }        from '@/hooks/useRealtimeChannel'  
  import { useMemo }                   from 'react'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionNotes(sessionId: number | null) {  
    const queryClient \= useQueryClient()

    const query \= useQuery({  
      queryKey: \['session', sessionId, 'notes'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/notes\`)  
        return res.data.notes as NoteRow\[\]  
      },  
      enabled: \!\!sessionId,  
      staleTime: 30\_000,  
    })

    // Subscribe to realtime note\_added events  
    const handlers \= useMemo(() \=\> ({  
      note\_added: (payload: Record\<string, unknown\>) \=\> {  
        // Prepend the new note to the cached list immediately  
        queryClient.setQueryData(  
          \['session', sessionId, 'notes'\],  
          (old: NoteRow\[\] | undefined) \=\> \[payload as unknown as NoteRow, ...(old ?? \[\])\]  
        )  
      },  
    }), \[sessionId, queryClient\])

    useRealtimeChannel(  
      \`session:${sessionId}\`,  
      handlers,  
      \!\!sessionId  
    )

    return {  
      notes:     query.data ?? \[\],  
      total:     query.data?.length ?? 0,  
      isLoading: query.isLoading,  
      refetch:   query.refetch,  
    }  
  }

  type NoteRow \= {  
    id:          number  
    content:     string  
    note\_type:   string  
    created\_at:  string  
    author\_name: string  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- handlers must be wrapped in useMemo to prevent useRealtimeChannel  
    from re-subscribing on every render  
  \- The realtime payload shape matches the API's broadcast payload —  
    cast it directly rather than fetching again  
  \- enabled: \!\!sessionId prevents subscription to 'session:null' channel  
\*/  
\`\`\`

\---

\#\# 21\. hooks/useAddNote.ts

\`\`\`ts  
/\*  
  FILE: hooks/useAddNote.ts  
  PURPOSE: Mutation for posting a session note (both free-text and  
           predefined chip notes).

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'

  type NoteType \=  
    | 'custom' | 'medication\_given' | 'elder\_resting' | 'meal\_completed'  
    | 'mobility\_assistance' | 'blood\_pressure\_checked' | 'hydration\_reminder'  
    | 'other'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useAddNote(sessionId: number) {  
    const queryClient \= useQueryClient()

    return useMutation({  
      mutationFn: async ({  
        content,  
        note\_type \= 'custom',  
      }: {  
        content:   string  
        note\_type?: NoteType  
      }) \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/notes\`, {  
          method: 'POST',  
          body: JSON.stringify({ content: content.trim(), note\_type }),  
        })  
        return res.data.note  
      },

      onSuccess: () \=\> {  
        // Notes are prepended via realtime event in useSessionNotes.  
        // Invalidate as a safety net for when realtime is unavailable.  
        queryClient.invalidateQueries({ queryKey: \['session', sessionId, 'notes'\] })  
      },  
    })  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  const { mutate: addNote, isPending } \= useAddNote(sessionId\!)

  // Free-text note — add 1s debounce on the input blur:  
  // onBlur={() \=\> addNote({ content: noteText, note\_type: 'custom' })}

  // Quick chip buttons:  
  // \<Chip onPress={() \=\> addNote({ content: 'Medication administered', note\_type: 'medication\_given' })} /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- content.trim() must be applied before calling the API — empty strings  
    are rejected by the server with a 400 error  
  \- chip buttons call addNote immediately on tap (no text input needed)  
  \- The realtime broadcast from the server handles the local list update;  
    invalidateQueries is a fallback only  
\*/  
\`\`\`

\--- 

\#\# 22\. hooks/useUpdateLocation.ts

\`\`\`ts  
/\*  
  FILE: hooks/useUpdateLocation.ts  
  PURPOSE: Background GPS watcher that sends location updates to the API  
           every time the caregiver moves \> 50m or every 10s.  
           Runs during active session, stops on check-out.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useEffect, useRef }         from 'react'  
  import \* as Location                 from 'expo-location'  
  import { fetchAPI }                  from '@/lib/fetch'  
  import { useCaregiverStore }         from '@/store/caregiverStore'  
  import { useActiveSessionStore }     from '@/store/activeSessionStore'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useUpdateLocation() {  
    const watcherRef    \= useRef\<Location.LocationSubscription | null\>(null)  
    const setLocation   \= useCaregiverStore(s \=\> s.setLocation)  
    const sessionId     \= useActiveSessionStore(s \=\> s.sessionId)  
    const sessionStatus \= useActiveSessionStore(s \=\> s.status)

    const isSessionActive \= sessionStatus \=== 'arriving' || sessionStatus \=== 'checked\_in'

    useEffect(() \=\> {  
      if (\!isSessionActive || \!sessionId) {  
        // Stop watcher if session is not active  
        watcherRef.current?.remove()  
        watcherRef.current \= null  
        return  
      }

      let lastSentAt \= 0   // timestamp of last API call

      async function startWatcher() {  
        const { status } \= await Location.requestForegroundPermissionsAsync()  
        if (status \!== 'granted') return

        watcherRef.current \= await Location.watchPositionAsync(  
          {  
            accuracy:           Location.Accuracy.Balanced,  
            distanceInterval:   50,    // metres — only fire when moved \> 50m  
            timeInterval:       10\_000, // also fire every 10s if stationary  
          },  
          async (loc) \=\> {  
            const now \= Date.now()  
            // Respect server-side rate limit: max 1 update per 10s  
            if (now \- lastSentAt \< 10\_000) return  
            lastSentAt \= now

            const { latitude: lat, longitude: lng } \= loc.coords  
            setLocation(lat, lng)   // update store immediately

            // Fire-and-forget — do not await or handle errors  
            fetchAPI('/api/caregivers/me/location', {  
              method: 'PATCH',  
              body: JSON.stringify({ lat, lng, session\_id: sessionId }),  
            }).catch(console.error)  
          }  
        )  
      }

      startWatcher().catch(console.error)

      return () \=\> {  
        watcherRef.current?.remove()  
        watcherRef.current \= null  
      }  
    }, \[isSessionActive, sessionId\])  
  }

  ── WIRING IN ACTIVE SESSION SCREEN ────────────────────────────────────────  
  // Call once at the top of the Active Session screen component:  
  useUpdateLocation()  
  // No return value needed — it runs as a side effect.

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- distanceInterval: 50 means the watcher only fires when the caregiver  
    moves at least 50 metres — prevents GPS noise updates  
  \- lastSentAt guard enforces the client-side rate limit that mirrors  
    the server-side 10s rate limit in location+api.ts  
  \- fetchAPI call is fire-and-forget — GPS updates should never block  
    the UI or propagate errors to the user  
  \- The watcher is torn down when isSessionActive becomes false — this  
    covers both check-out and session cancellation  
\*/  
\`\`\`

\---

\#\# 23\. hooks/useSessionETA.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionETA.ts  
  PURPOSE: Fetches ETA from caregiver to elder via the Google Directions  
           proxy. Polls every 60s during 'arriving' status only.  
           Also subscribes to realtime caregiver\_location\_updated events  
           to animate the map marker.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useQueryClient }  from '@tanstack/react-query'  
  import { fetchAPI }                  from '@/lib/fetch'  
  import { useActiveSessionStore }     from '@/store/activeSessionStore'  
  import { useRealtimeChannel }        from '@/hooks/useRealtimeChannel'  
  import { useCaregiverStore }         from '@/store/caregiverStore'  
  import { useMemo }                   from 'react'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionETA(sessionId: number | null) {  
    const queryClient   \= useQueryClient()  
    const sessionStatus \= useActiveSessionStore(s \=\> s.status)  
    const setLocation   \= useCaregiverStore(s \=\> s.setLocation)

    const isArriving \= sessionStatus \=== 'arriving'

    const query \= useQuery({  
      queryKey: \['session', sessionId, 'eta'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/eta\`)  
        return res.data as ETAData  
      },  
      enabled:          \!\!sessionId && isArriving,  
      refetchInterval:  isArriving ? 60\_000 : false,  
      staleTime:        30\_000,  
    })

    // Realtime: update caregiver marker when location changes  
    const handlers \= useMemo(() \=\> ({  
      caregiver\_location\_updated: (payload: Record\<string, unknown\>) \=\> {  
        const { lat, lng } \= payload as { lat: number; lng: number }  
        setLocation(lat, lng)  
        // Invalidate ETA after location update for fresh route calculation  
        queryClient.invalidateQueries({ queryKey: \['session', sessionId, 'eta'\] })  
      },  
    }), \[sessionId, queryClient, setLocation\])

    useRealtimeChannel(\`session:${sessionId}\`, handlers, \!\!sessionId)

    return {  
      eta:          query.data ?? null,  
      duration:     query.data?.duration\_text  ?? 'Calculating...',  
      distance:     query.data?.distance\_text  ?? '--',  
      polyline:     query.data?.polyline\_points ?? null,  
      fromCache:    query.data?.from\_cache ?? false,  
      isLoading:    query.isLoading,  
    }  
  }

  type ETAData \= {  
    duration\_seconds: number  
    duration\_text:    string  
    distance\_meters:  number  
    distance\_text:    string  
    polyline\_points:  string  
    origin:           { lat: number; lng: number }  
    destination:      { lat: number; lng: number }  
    from\_cache:       boolean  
    cache\_age\_seconds: number  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- enabled and refetchInterval both check isArriving — ETA is only  
    meaningful when the caregiver is en route  
  \- polyline\_points is an encoded string — pass it directly to the map  
    component's MapPolyline prop; do NOT decode it here  
  \- 'Calculating...' fallback prevents the UI from showing undefined  
    while the first fetch is in flight  
\*/  
\`\`\`

\---

\#\# 24\. hooks/useSendEmergencyAlert.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSendEmergencyAlert.ts  
  PURPOSE: Mutation for sending an SOS alert with a countdown  
           confirmation dialog.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation }           from '@tanstack/react-query'  
  import { fetchAPI }              from '@/lib/fetch'  
  import { useActiveSessionStore } from '@/store/activeSessionStore'  
  import \* as Location             from 'expo-location'  
  import { Alert }                 from 'react-native'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSendEmergencyAlert() {  
    const sessionId \= useActiveSessionStore(s \=\> s.sessionId)  
    const elderId   \= useActiveSessionStore(s \=\> s.elder\_id)

    const mutation \= useMutation({  
      mutationFn: async () \=\> {  
        if (\!elderId) throw new Error('No elder associated with this session')

        // Get current location for the alert  
        let lat: number | null \= null  
        let lng: number | null \= null  
        try {  
          const loc \= await Location.getCurrentPositionAsync({  
            accuracy: Location.Accuracy.Balanced,  
          })  
          lat \= loc.coords.latitude  
          lng \= loc.coords.longitude  
        } catch {  
          // Location is optional — proceed without it  
        }

        const res \= await fetchAPI('/api/emergency-alerts', {  
          method: 'POST',  
          body: JSON.stringify({  
            elder\_id:   elderId,  
            alert\_type: 'sos',  
            session\_id: sessionId ?? undefined,  
            lat,  
            lng,  
          }),  
        })  
        return res.data  
      },

      onSuccess: () \=\> {  
        Alert.alert(  
          'Alert Sent',  
          'Emergency alert sent. All linked relatives have been notified.',  
          \[{ text: 'OK' }\]  
        )  
      },

      onError: (error: Error) \=\> {  
        Alert.alert('Alert Failed', \`Could not send alert: ${error.message}\`)  
      },  
    })

    // Public method: show 3-second countdown confirmation  
    function triggerSOS() {  
      Alert.alert(  
        '🚨 Send Emergency Alert?',  
        'This will notify all linked relatives immediately.',  
        \[  
          { text: 'Cancel', style: 'cancel' },  
          {  
            text: 'Send Alert',  
            style: 'destructive',  
            onPress: () \=\> mutation.mutate(),  
          },  
        \]  
      )  
    }

    return {  
      triggerSOS,  
      isSending: mutation.isPending,  
    }  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Location is optional — the try/catch allows the alert to proceed  
    even if GPS is unavailable or permission is denied  
  \- The 3-second countdown can be implemented as a custom modal instead  
    of Alert.alert for a more accessible UX — Alert.alert is the minimal  
    implementation  
  \- session\_id is optional in the API — pass it when available to link  
    the alert to the active session record  
\*/  
\`\`\`

\---

\# CHAT SCREEN

\---

\#\# 25\. hooks/useConversations.ts

\`\`\`ts  
/\*  
  FILE: hooks/useConversations.ts  
  PURPOSE: Fetches all conversation threads for the Chat screen list.  
           Supports filter tabs and search. Syncs total\_unread into  
           chatStore.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useQueryClient }  from '@tanstack/react-query'  
  import { fetchAPI }                  from '@/lib/fetch'  
  import { useChatStore }              from '@/store/chatStore'  
  import { useRealtimeChannel }        from '@/hooks/useRealtimeChannel'  
  import { useMemo }                   from 'react'

  type ConversationFilter \= 'all' | 'active' | 'unread' | 'archived'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useConversations(filter: ConversationFilter \= 'all', search?: string) {  
    const queryClient  \= useQueryClient()  
    const setUnread    \= useChatStore((s: any) \=\> s.setTotalUnread)

    const query \= useQuery({  
      queryKey: \['caregiver', 'conversations', filter, search\],  
      queryFn: async () \=\> {  
        const params \= new URLSearchParams({ filter })  
        if (search?.trim()) params.set('search', search.trim())  
        const res \= await fetchAPI(\`/api/caregivers/me/conversations?${params}\`)  
        setUnread(res.data.total\_unread)  
        return res.data.conversations as ConversationRow\[\]  
      },  
      staleTime: 10\_000,  
      refetchOnWindowFocus: true,  
    })

    // Realtime: refresh conversation list when a new message arrives  
    const handlers \= useMemo(() \=\> ({  
      new\_message: () \=\> {  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'conversations'\] })  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'unread-count'\] })  
      },  
    }), \[queryClient\])

    // Subscribe to all sessions — use a wildcard-style channel if supported,  
    // otherwise invalidate on any new\_message from known session channels  
    useRealtimeChannel('caregivers:availability', handlers, true)

    return {  
      conversations: query.data ?? \[\],  
      isLoading:     query.isLoading,  
      refetch:       query.refetch,  
    }  
  }

  type ConversationRow \= {  
    session\_id:      number  
    care\_type:       string  
    status:          string  
    scheduled\_at:    string  
    relative\_name:   string  
    elder\_name:      string  
    last\_message:    string | null  
    last\_message\_at: string | null  
    unread\_count:    number  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- queryKey must include filter and search so changing either  
    triggers a new fetch rather than returning stale filtered data  
  \- refetchOnWindowFocus: true ensures the list updates when the  
    caregiver navigates back to the Chat tab  
  \- Search filtering is done server-side — do NOT filter the results  
    array client-side  
\*/  
\`\`\`

\---

\#\# 26\. hooks/useMessages.ts

\`\`\`ts  
/\*  
  FILE: hooks/useMessages.ts  
  PURPOSE: Cursor-paginated message thread for the active chat view.  
           Marks messages as read on mount. Subscribes to new\_message  
           and typing realtime events.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query'  
  import { fetchAPI }                                       from '@/lib/fetch'  
  import { useRealtimeChannel }                            from '@/hooks/useRealtimeChannel'  
  import { useChatStore }                                  from '@/store/chatStore'  
  import { useMemo, useEffect }                            from 'react'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useMessages(sessionId: number | null) {  
    const queryClient   \= useQueryClient()  
    const setTyping     \= useChatStore((s: any) \=\> s.setTypingState)

    // PART 1 — Infinite query for paginated messages  
    const query \= useInfiniteQuery({  
      queryKey: \['session', sessionId, 'messages'\],  
      queryFn: async ({ pageParam }) \=\> {  
        const params \= new URLSearchParams({ limit: '50' })  
        if (pageParam) params.set('cursor', String(pageParam))  
        const res \= await fetchAPI(  
          \`/api/care-sessions/${sessionId}/messages?${params}\`  
        )  
        return res.data  
      },  
      getNextPageParam: (lastPage) \=\>  
        lastPage.pagination.has\_more ? lastPage.pagination.next\_cursor : undefined,  
      initialPageParam: undefined,  
      enabled: \!\!sessionId,  
      staleTime: 30\_000,  
    })

    // Flatten all pages into a single chronological array  
    const allMessages \= query.data?.pages.flatMap(p \=\> p.messages) ?? \[\]

    // PART 2 — Mark messages as read on mount  
    useEffect(() \=\> {  
      if (\!sessionId) return  
      fetchAPI(\`/api/care-sessions/${sessionId}/messages\`, {  
        method: 'PATCH',   // mark-read endpoint  
      }).catch(console.error)  
    }, \[sessionId\])

    // PART 3 — Realtime subscriptions  
    const handlers \= useMemo(() \=\> ({  
      new\_message: (payload: Record\<string, unknown\>) \=\> {  
        queryClient.setQueryData(  
          \['session', sessionId, 'messages'\],  
          (old: any) \=\> {  
            if (\!old?.pages?.length) return old  
            const newMsg \= payload  
            const updatedPages \= \[...old.pages\]  
            updatedPages\[updatedPages.length \- 1\] \= {  
              ...updatedPages\[updatedPages.length \- 1\],  
              messages: \[  
                ...updatedPages\[updatedPages.length \- 1\].messages,  
                newMsg,  
              \],  
            }  
            return { ...old, pages: updatedPages }  
          }  
        )  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'unread-count'\] })  
      },  
      typing: (payload: Record\<string, unknown\>) \=\> {  
        setTyping(sessionId\!, payload.user\_id as number, payload.name as string)  
        // Auto-clear after 3 seconds  
        setTimeout(() \=\> setTyping(sessionId\!, null, null), 3\_000)  
      },  
    }), \[sessionId, queryClient, setTyping\])

    useRealtimeChannel(\`session:${sessionId}\`, handlers, \!\!sessionId)

    return {  
      messages:        allMessages,  
      sessionContext:  query.data?.pages\[0\]?.session ?? null,  
      isLoading:       query.isLoading,  
      isFetchingMore:  query.isFetchingNextPage,  
      hasMore:         query.hasNextPage,  
      fetchOlderMessages: query.fetchNextPage,  
    }  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- useInfiniteQuery's next\_cursor is the oldest message ID in the page  
    (for scrolling UP to load older messages)  
  \- The mark-read PATCH is fire-and-forget — errors are swallowed  
  \- typing auto-clear uses setTimeout: 3000ms without a server stop-typing  
    event — this is intentional (see typing+api.ts constraints)  
  \- new\_message appends to the LAST page — not the first — because  
    the list is ordered oldest-first  
\*/  
\`\`\`

\---

\#\# 27\. hooks/useSendMessage.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSendMessage.ts  
  PURPOSE: Mutation for sending a chat message with optimistic UI.  
           Also fires the typing indicator on input change.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useCallback, useRef }         from 'react'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  HOOK 1 — useSendMessage(sessionId)

  export function useSendMessage(sessionId: number) {  
    const queryClient \= useQueryClient()

    return useMutation({  
      mutationFn: async (content: string) \=\> {  
        const res \= await fetchAPI(\`/api/care-sessions/${sessionId}/messages\`, {  
          method: 'POST',  
          body: JSON.stringify({ content: content.trim() }),  
        })  
        return res.data.message  
      },

      onMutate: async (content) \=\> {  
        // Optimistic message with sending status  
        const optimisticMsg \= {  
          id:             \-Date.now(),  
          session\_id:     sessionId,  
          sender\_user\_id: \-1,          // self — UI checks sender\_role  
          content:        content.trim(),  
          message\_type:   'text',  
          is\_read:        false,  
          created\_at:     new Date().toISOString(),  
          sender\_name:    'You',  
          sender\_role:    'caregiver',  
          \_optimistic:    true,        // flag for 'sending' delivery status  
        }

        queryClient.setQueryData(  
          \['session', sessionId, 'messages'\],  
          (old: any) \=\> {  
            if (\!old?.pages?.length) return old  
            const updatedPages \= \[...old.pages\]  
            const lastPage \= updatedPages\[updatedPages.length \- 1\]  
            updatedPages\[updatedPages.length \- 1\] \= {  
              ...lastPage,  
              messages: \[...lastPage.messages, optimisticMsg\],  
            }  
            return { ...old, pages: updatedPages }  
          }  
        )  
        return { optimisticId: optimisticMsg.id }  
      },

      onSuccess: (confirmedMsg, \_content, context) \=\> {  
        // Replace the optimistic message with the confirmed one  
        queryClient.setQueryData(  
          \['session', sessionId, 'messages'\],  
          (old: any) \=\> {  
            if (\!old?.pages?.length) return old  
            const updatedPages \= old.pages.map((page: any) \=\> ({  
              ...page,  
              messages: page.messages.map((m: any) \=\>  
                m.id \=== context?.optimisticId ? confirmedMsg : m  
              ),  
            }))  
            return { ...old, pages: updatedPages }  
          }  
        )  
      },

      onError: (\_error, \_content, context) \=\> {  
        // Remove the failed optimistic message  
        queryClient.setQueryData(  
          \['session', sessionId, 'messages'\],  
          (old: any) \=\> {  
            if (\!old?.pages?.length) return old  
            const updatedPages \= old.pages.map((page: any) \=\> ({  
              ...page,  
              messages: page.messages.filter((m: any) \=\> m.id \!== context?.optimisticId),  
            }))  
            return { ...old, pages: updatedPages }  
          }  
        )  
      },  
    })  
  }

  HOOK 2 — useTypingIndicator(sessionId)

  export function useTypingIndicator(sessionId: number) {  
    const debounceRef \= useRef\<ReturnType\<typeof setTimeout\>\>()

    const sendTyping \= useCallback(() \=\> {  
      clearTimeout(debounceRef.current)  
      debounceRef.current \= setTimeout(() \=\> {  
        // Fire-and-forget — no error handling needed  
        fetchAPI(\`/api/care-sessions/${sessionId}/typing\`, {  
          method: 'POST',  
        }).catch(() \=\> {})  
      }, 400\)   // 400ms debounce — fires after typing pauses  
    }, \[sessionId\])

    return { sendTyping }  
  }

  ── WIRING IN ACTIVE CHAT VIEW ─────────────────────────────────────────────  
  const { mutate: sendMessage, isPending } \= useSendMessage(sessionId\!)  
  const { sendTyping } \= useTypingIndicator(sessionId\!)

  // MessageComposer:  
  // onChangeText={() \=\> sendTyping()}  
  // onSend={(text) \=\> sendMessage(text)}  
\*/  
\`\`\`

\---

\#\# 28\. hooks/useRealtimeUnreadCount.ts

\`\`\`ts  
/\*  
  FILE: hooks/useUnreadCount.ts  
  PURPOSE: Fetches total unread messages for the Chat tab badge.  
           Invalidates on new\_message realtime events.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useQueryClient }  from '@tanstack/react-query'  
  import { fetchAPI }                  from '@/lib/fetch'  
  import { useChatStore }              from '@/store/chatStore'  
  import { useMemo }                   from 'react'  
  import { useRealtimeChannel }        from '@/hooks/useRealtimeChannel'  
  import { useAppState }               from '@react-native-community/hooks'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useUnreadCount() {  
    const queryClient \= useQueryClient()  
    const setUnread   \= useChatStore((s: any) \=\> s.setTotalUnread)  
    const appState    \= useAppState()

    const query \= useQuery({  
      queryKey: \['caregiver', 'unread-count'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/unread-count')  
        setUnread(res.data.unread\_count)  
        return res.data.unread\_count as number  
      },  
      staleTime: 10\_000,  
      // Refetch when app comes back to foreground  
      refetchOnWindowFocus: true,  
    })

    // Also refetch when AppState changes to 'active'  
    // (covers returning from background on mobile)  
    useEffect(() \=\> {  
      if (appState \=== 'active') {  
        query.refetch()  
      }  
    }, \[appState\])

    // Realtime: increment count immediately on new message  
    const handlers \= useMemo(() \=\> ({  
      new\_message: (payload: Record\<string, unknown\>) \=\> {  
        // Only increment if the sender is NOT the caregiver  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'unread-count'\] })  
      },  
    }), \[queryClient\])

    // Subscribe to a global channel for all caregiver sessions  
    useRealtimeChannel('caregivers:availability', handlers, true)

    return {  
      unreadCount: query.data ?? 0,  
    }  
  }

  ── WIRING IN TAB BAR ──────────────────────────────────────────────────────  
  const { unreadCount } \= useUnreadCount()  
  // Pass to the Chat tab badge:  
  // tabBarBadge={unreadCount \> 0 ? unreadCount : undefined}

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- useAppState from @react-native-community/hooks handles foreground  
    detection on both iOS and Android — AppState from react-native is  
    an alternative if the community package is not installed  
  \- Install: npx expo install @react-native-community/hooks  
  \- unreadCount defaults to 0 — never render the badge with undefined  
\*/  
\`\`\`

\---

\# SESSION HISTORY SCREEN

\---

\#\# 29\. hooks/useSessionHistory.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionHistory.ts  
  PURPOSE: Infinite-scroll session history list with status filter,  
           search, and sort options for the Session History screen.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useInfiniteQuery } from '@tanstack/react-query'  
  import { fetchAPI }         from '@/lib/fetch'

  type HistoryFilter \= 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled'  
  type HistorySort   \= 'newest' | 'oldest' | 'highest\_earnings' | 'longest'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionHistory(  
    filter: HistoryFilter \= 'all',  
    sort:   HistorySort   \= 'newest',  
    search?: string  
  ) {  
    const query \= useInfiniteQuery({  
      queryKey: \['caregiver', 'sessions', filter, sort, search\],  
      queryFn: async ({ pageParam }) \=\> {  
        const params \= new URLSearchParams({ status: filter, sort, limit: '20' })  
        if (search?.trim()) params.set('search', search.trim())  
        if (pageParam)      params.set('cursor', String(pageParam))  
        const res \= await fetchAPI(\`/api/caregivers/me/sessions?${params}\`)  
        return res.data  
      },  
      getNextPageParam: (lastPage) \=\>  
        lastPage.pagination.has\_more ? lastPage.pagination.next\_cursor : undefined,  
      initialPageParam: undefined,  
      staleTime: 30\_000,  
    })

    const sessions \= query.data?.pages.flatMap(p \=\> p.sessions) ?? \[\]

    return {  
      sessions,  
      isLoading:       query.isLoading,  
      isFetchingMore:  query.isFetchingNextPage,  
      hasMore:         query.hasNextPage,  
      fetchNextPage:   query.fetchNextPage,  
      refetch:         query.refetch,  
    }  
  }

  ── WIRING IN SESSION HISTORY SCREEN ───────────────────────────────────────  
  const \[filter, setFilter\] \= useState\<HistoryFilter\>('all')  
  const \[sort, setSort\]     \= useState\<HistorySort\>('newest')  
  const \[search, setSearch\] \= useState('')  
  // Debounce search: 400ms  
  const debouncedSearch \= useDebounce(search, 400\)

  const { sessions, isLoading, hasMore, fetchNextPage } \=  
    useSessionHistory(filter, sort, debouncedSearch)

  // FlatList with onEndReached={() \=\> hasMore && fetchNextPage()}

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Filter, sort, and search are all in queryKey — any change resets  
    pagination to page 1 automatically (React Query clears the cache)  
  \- Search must be debounced 400ms BEFORE being passed to the hook —  
    do not debounce inside the hook itself  
  \- Do NOT use OFFSET pagination — cursor-based only (has\_more \+ next\_cursor)  
\*/  
\`\`\`

\---

\#\# 30\. hooks/useSessionCounts.ts

\`\`\`ts  
/\*  
  FILE: hooks/useSessionCounts.ts  
  PURPOSE: Fetches aggregated session counts for the Session History  
           screen header pills. Invalidated after any session status change.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery } from '@tanstack/react-query'  
  import { fetchAPI } from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useSessionCounts() {  
    const query \= useQuery({  
      queryKey: \['caregiver', 'session-counts'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/session-counts')  
        return res.data as {  
          total:     number  
          upcoming:  number  
          active:    number  
          completed: number  
          cancelled: number  
        }  
      },  
      staleTime: 60\_000,  
    })

    return {  
      counts:    query.data ?? { total: 0, upcoming: 0, active: 0, completed: 0, cancelled: 0 },  
      isLoading: query.isLoading,  
    }  
  }

  ── INVALIDATION ───────────────────────────────────────────────────────────  
  // In useCheckOut.ts and useUpdateSessionStatus.ts onSuccess callbacks:  
  queryClient.invalidateQueries({ queryKey: \['caregiver', 'session-counts'\] })

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Default value is all zeros — never undefined — so pill badges render  
    without conditional checks in the screen component  
  \- staleTime: 60s — this is a summary count, not real-time critical data  
\*/  
\`\`\`

\---

\#\# 31\. hooks/useEarnings.ts

\`\`\`ts  
/\*  
  FILE: hooks/useEarnings.ts  
  PURPOSE: Fetches earnings total and session count for a time period.  
           Used by both Session History and Profile screens.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery } from '@tanstack/react-query'  
  import { fetchAPI } from '@/lib/fetch'

  type EarningsPeriod \= 'today' | 'week' | 'month'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  export function useEarnings(period: EarningsPeriod \= 'week') {  
    const query \= useQuery({  
      queryKey: \['caregiver', 'earnings', period\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI(\`/api/caregivers/me/earnings?period=${period}\`)  
        return res.data as {  
          period:         string  
          earnings\_total: number  
          session\_count:  number  
        }  
      },  
      staleTime: 5 \* 60 \* 1000,   // 5 minutes  
    })

    return {  
      earningsTotal:  query.data?.earnings\_total ?? 0,  
      sessionCount:   query.data?.session\_count  ?? 0,  
      period,  
      isLoading:      query.isLoading,  
    }  
  }  
\*/  
\`\`\`

\---

\#\# 32\. hooks/useWeeklyBreakdown.ts

\`\`\`ts  
/\*  
  FILE: hooks/useWeeklyBreakdown.ts  
  PURPOSE: Fetches 7-day earnings breakdown for the bar chart in  
           Session History and Profile earnings sections.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery } from '@tanstack/react-query'  
  import { fetchAPI } from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type DayBreakdown \= {  
    date:          string   // 'YYYY-MM-DD'  
    earnings:      number  
    session\_count: number  
  }

  export function useWeeklyBreakdown() {  
    const query \= useQuery({  
      queryKey: \['caregiver', 'earnings', 'weekly-breakdown'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/earnings/weekly-breakdown')  
        return res.data.breakdown as DayBreakdown\[\]  
      },  
      staleTime: 10 \* 60 \* 1000,   // 10 minutes  
    })

    return {  
      breakdown: query.data ?? \[\],  
      // Transform for react-native-gifted-charts BarChart:  
      chartData: (query.data ?? \[\]).map(d \=\> ({  
        value: d.earnings,  
        label: d.date.slice(5),     // 'MM-DD' label  
        frontColor: '\#1D9E75',  
      })),  
      isLoading: query.isLoading,  
    }  
  }

  ── WIRING ─────────────────────────────────────────────────────────────────  
  const { chartData, isLoading } \= useWeeklyBreakdown()  
  // \<BarChart data={chartData} ... /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- chartData transform is done here, not in the component — keeps the  
    screen component clean and the transform unit-testable  
  \- Always return exactly 7 items (including zero-earnings days) — the  
    API guarantees this with generate\_series  
\*/  
\`\`\`

\---

\#\# 33\. hooks/useMonthlyBreakdown.ts

\`\`\`ts  
/\*  
  FILE: hooks/useMonthlyBreakdown.ts  
  PURPOSE: Fetches 6-month earnings trend for the monthly chart.

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type MonthBreakdown \= {  
    month:         string   // 'YYYY-MM'  
    earnings:      number  
    session\_count: number  
  }

  export function useMonthlyBreakdown() {  
    const query \= useQuery({  
      queryKey: \['caregiver', 'earnings', 'monthly-breakdown'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/earnings/monthly-breakdown')  
        return res.data.breakdown as MonthBreakdown\[\]  
      },  
      staleTime: 15 \* 60 \* 1000,  // 15 minutes  
    })

    return {  
      breakdown: query.data ?? \[\],  
      chartData: (query.data ?? \[\]).map(d \=\> ({  
        value:      d.earnings,  
        label:      d.month.slice(5),   // 'MM' — month number label  
        frontColor: '\#1D9E75',  
      })),  
      isLoading: query.isLoading,  
    }  
  }  
\*/  
\`\`\`

\---

\#\# 34\. hooks/useEarningsHistory.ts

\`\`\`ts  
/\*  
  FILE: hooks/useEarningsHistory.ts  
  PURPOSE: Paginated per-session earnings list for the Profile  
           earnings history section. Includes pending\_payout total.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useInfiniteQuery } from '@tanstack/react-query'  
  import { fetchAPI }         from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type EarningsHistoryRow \= {  
    id:                      number  
    care\_type:               string  
    scheduled\_at:            string  
    actual\_duration\_minutes: number | null  
    total\_cost:              number | null  
    status:                  string  
    checked\_out\_at:          string | null  
    elder\_name:              string  
    payment\_status:          string | null  
    paid\_at:                 string | null  
  }

  export function useEarningsHistory() {  
    const query \= useInfiniteQuery({  
      queryKey: \['caregiver', 'earnings', 'history'\],  
      queryFn: async ({ pageParam }) \=\> {  
        const params \= new URLSearchParams({ limit: '20' })  
        if (pageParam) params.set('cursor', String(pageParam))  
        const res \= await fetchAPI(\`/api/caregivers/me/earnings/history?${params}\`)  
        return res.data as {  
          history:        EarningsHistoryRow\[\]  
          pending\_payout: number  
          pagination:     { has\_more: boolean; next\_cursor: number | null }  
        }  
      },  
      getNextPageParam: (lastPage) \=\>  
        lastPage.pagination.has\_more ? lastPage.pagination.next\_cursor : undefined,  
      initialPageParam: undefined,  
      staleTime: 5 \* 60 \* 1000,  
    })

    const allHistory    \= query.data?.pages.flatMap(p \=\> p.history) ?? \[\]  
    const pendingPayout \= query.data?.pages\[0\]?.pending\_payout ?? 0

    return {  
      history:        allHistory,  
      pendingPayout,  
      isLoading:      query.isLoading,  
      isFetchingMore: query.isFetchingNextPage,  
      hasMore:        query.hasNextPage,  
      fetchNextPage:  query.fetchNextPage,  
    }  
  }

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- pendingPayout is always read from the first page — it is a global  
    total, not per-page, so all pages return the same value  
  \- payment\_status \= 'pending' → show 'Payout pending'  
  \- payment\_status \= 'succeeded' → show paid\_at date  
  \- payment\_status \= null → no payment record yet  
\*/  
\`\`\`

\---

\#\# 35\. hooks/useAnalytics.ts

\`\`\`ts  
/\*  
  FILE: hooks/useAnalytics.ts  
  PURPOSE: Performance metrics for Profile analytics section and  
           Session History analytics preview card.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery } from '@tanstack/react-query'  
  import { fetchAPI } from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type AnalyticsData \= {  
    avg\_payout\_per\_session:    number  
    avg\_session\_duration\_mins: number  
    completed\_sessions:        number  
    most\_common\_care\_type:     string | null  
    response\_rate\_pct:         number | null  
    weekly\_earnings:           number  
  }

  export function useAnalytics() {  
    const query \= useQuery({  
      queryKey: \['caregiver', 'analytics'\],  
      queryFn: async () \=\> {  
        const res \= await fetchAPI('/api/caregivers/me/analytics')  
        return res.data as AnalyticsData  
      },  
      staleTime: 10 \* 60 \* 1000,  
    })

    return {  
      analytics:  query.data ?? null,  
      isLoading:  query.isLoading,  
    }  
  }

  ── WIRING IN SESSION HISTORY ANALYTICS CARD ───────────────────────────────  
  const { analytics, isLoading } \= useAnalytics()

  // response\_rate\_pct null → show '—' not '0%'  
  const rateLabel \= analytics?.response\_rate\_pct \!= null  
    ? \`${analytics.response\_rate\_pct}%\`  
    : '—'

  // most\_common\_care\_type null → show 'No sessions yet'  
\*/  
\`\`\`

\---

\# PROFILE SCREEN 

\#\# 36\. hooks/useUpdateProfile.ts

\`\`\`ts  
/\*  
  FILE: hooks/useUpdateProfile.ts  
  PURPOSE: Mutation for updating the caregiver's editable profile  
           fields from the EditProfileModal.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                    from '@/lib/fetch'  
  import { useCaregiverStore }           from '@/store/caregiverStore'  
  import { Alert }                       from 'react-native'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type ProfileUpdatePayload \= Partial\<{  
    bio:              string  
    hourly\_rate:      number  
    years\_experience: number  
    care\_types:       string\[\]  
    languages:        string\[\]  
    service\_radius\_km: number  
  }\>

  export function useUpdateProfile() {  
    const queryClient \= useQueryClient()  
    const setProfile  \= useCaregiverStore(s \=\> s.setProfile)

    return useMutation({  
      mutationFn: async (payload: ProfileUpdatePayload) \=\> {  
        // Client-side validation  
        if (payload.hourly\_rate \!== undefined && payload.hourly\_rate \<= 0\) {  
          throw new Error('Hourly rate must be greater than 0')  
        }  
        const res \= await fetchAPI('/api/caregivers/me', {  
          method: 'PATCH',  
          body: JSON.stringify(payload),  
        })  
        return res.data  
      },

      onSuccess: (updatedProfile) \=\> {  
        setProfile(updatedProfile)  
        queryClient.invalidateQueries({ queryKey: \['caregiver', 'me'\] })  
        Alert.alert('Profile Updated', 'Your profile has been saved.')  
      },

      onError: (error: Error) \=\> {  
        Alert.alert('Update Failed', error.message)  
      },  
    })  
  }

  ── WIRING IN EDIT PROFILE MODAL ───────────────────────────────────────────  
  const { mutate: updateProfile, isPending } \= useUpdateProfile()

  // Save button:  
  \<Button  
    title={isPending ? 'Saving...' : 'Save'}  
    onPress={() \=\> updateProfile({ bio, hourly\_rate: parseFloat(rate), care\_types, languages })}  
    disabled={isPending}  
  /\>  
\*/  
\`\`\`

\---

\#\# 37\. hooks/useAvailabilitySchedule.ts

\`\`\`ts  
/\*  
  FILE: hooks/useAvailabilitySchedule.ts  
  PURPOSE: Fetch and replace the caregiver's weekly availability  
           schedule in Profile settings.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                              from '@/lib/fetch'  
  import { Alert }                                 from 'react-native'

  ── WHAT TO GENERATE — 2 HOOKS IN ONE FILE ─────────────────────────────────

  type AvailabilitySlot \= {  
    day\_of\_week: number   // 0-6 (0 \= Sunday)  
    start\_time:  string   // 'HH:MM:SS'  
    end\_time:    string   // 'HH:MM:SS'  
    is\_active:   boolean  
  }

  HOOK 1 — useAvailabilitySchedule()  
    queryKey: \['caregiver', 'availability'\]  
    queryFn:  GET /api/caregivers/me/availability  
    Returns:  { schedule: AvailabilitySlot\[\], isLoading }  
    staleTime: 5 \* 60 \* 1000

  HOOK 2 — useUpdateSchedule()  
    mutationFn: PUT /api/caregivers/me/availability  
    Body: { schedule: AvailabilitySlot\[\] }  
    onSuccess: invalidate \['caregiver', 'availability'\],  
               Alert.alert('Schedule Saved', 'Your availability has been updated.')  
    onError:   Alert.alert('Save Failed', error.message)  
    Returns:   { updateSchedule: mutate, isSaving: isPending }

    NOTE: PUT replaces the entire schedule — the client must send all  
    slots including unchanged ones, not just the modified ones.

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Validate start\_time \< end\_time client-side before calling mutate  
  \- day\_of\_week 0 \= Sunday ... 6 \= Saturday  
  \- is\_active false slots are stored but not shown on the Find Care screen  
\*/  
\`\`\`

\---

\#\# 38\. hooks/useReviews.ts

\`\`\`ts  
/\*  
  FILE: hooks/useReviews.ts  
  PURPOSE: Paginated reviews for the Profile ratings section.  
           Includes rating breakdown for the histogram.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useInfiniteQuery } from '@tanstack/react-query'  
  import { fetchAPI }         from '@/lib/fetch'

  ── WHAT TO GENERATE ───────────────────────────────────────────────────────

  type ReviewRow \= {  
    id:           number  
    rating:       number  
    comment:      string | null  
    care\_type:    string  
    reviewer\_name: string  
    created\_at:   string  
  }

  export function useReviews() {  
    const query \= useInfiniteQuery({  
      queryKey: \['caregiver', 'reviews'\],  
      queryFn: async ({ pageParam }) \=\> {  
        const params \= new URLSearchParams({ limit: '10' })  
        if (pageParam) params.set('cursor', String(pageParam))  
        const res \= await fetchAPI(\`/api/caregivers/me/reviews?${params}\`)  
        return res.data as {  
          reviews:          ReviewRow\[\]  
          rating\_breakdown: Record\<string, number\>   // { '5': N, '4': N, ... }  
          pagination:       { has\_more: boolean; next\_cursor: number | null }  
        }  
      },  
      getNextPageParam: (lastPage) \=\>  
        lastPage.pagination.has\_more ? lastPage.pagination.next\_cursor : undefined,  
      initialPageParam: undefined,  
      staleTime: 10 \* 60 \* 1000,  
    })

    const allReviews      \= query.data?.pages.flatMap(p \=\> p.reviews) ?? \[\]  
    const ratingBreakdown \= query.data?.pages\[0\]?.rating\_breakdown ?? {}

    return {  
      reviews:        allReviews,  
      ratingBreakdown,  
      isLoading:      query.isLoading,  
      isFetchingMore: query.isFetchingNextPage,  
      hasMore:        query.hasNextPage,  
      fetchNextPage:  query.fetchNextPage,  
    }  
  }

  ── WIRING RATING HISTOGRAM ────────────────────────────────────────────────  
  // Compute bar percentage for each star level:  
  const totalReviews \= caregiver?.total\_reviews ?? 1  // avoid divide by zero  
  const fiveStarPct  \= ((ratingBreakdown\['5'\] ?? 0\) / totalReviews) \* 100  
\*/  
\`\`\`

\---

\#\# 39\. hooks/useNotificationPreferences.ts

\`\`\`ts  
/\*  
  FILE: hooks/useNotificationPreferences.ts  
  PURPOSE: Fetch and update caregiver notification toggle settings in  
           Profile. Uses a 500ms debounced PATCH on each toggle change.

  ── IMPORTS ────────────────────────────────────────────────────────────────  
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'  
  import { fetchAPI }                              from '@/lib/fetch'  
  import { useRef, useCallback }                   from 'react'

  ── WHAT TO GENERATE — 2 HOOKS IN ONE FILE ─────────────────────────────────

  type NotificationPreferences \= {  
    booking\_alerts:        boolean  
    message\_alerts:        boolean  
    sos\_alerts:            boolean  
    reminder\_notifications: boolean  
  }

  const DEFAULT\_PREFERENCES: NotificationPreferences \= {  
    booking\_alerts:         true,  
    message\_alerts:         true,  
    sos\_alerts:             true,  
    reminder\_notifications: true,  
  }

  HOOK 1 — useNotificationPreferences()  
    queryKey:  \['caregiver', 'notification-preferences'\]  
    queryFn:   GET /api/caregivers/me/notification-preferences  
    staleTime: 10 \* 60 \* 1000  
    Returns:   {  
      preferences: NotificationPreferences,  
      isLoading:   boolean  
    }  
    Default:   DEFAULT\_PREFERENCES (merge with API response)  
               const prefs \= { ...DEFAULT\_PREFERENCES, ...(res.data.preferences ?? {}) }

  HOOK 2 — useUpdateNotificationPreferences()  
    mutationFn: PATCH /api/caregivers/me/notification-preferences  
    Body:       partial NotificationPreferences

    Wrap the mutation in a 500ms debounced function:  
      const debounceRef \= useRef\<ReturnType\<typeof setTimeout\>\>()

      const debouncedUpdate \= useCallback((prefs: Partial\<NotificationPreferences\>) \=\> {  
        clearTimeout(debounceRef.current)  
        debounceRef.current \= setTimeout(() \=\> {  
          mutation.mutate(prefs)  
        }, 500\)  
      }, \[\])

    onSuccess: invalidate \['caregiver', 'notification-preferences'\]  
    Returns:   { debouncedUpdate }

  ── WIRING TOGGLE SWITCHES ─────────────────────────────────────────────────  
  const { preferences } \= useNotificationPreferences()  
  const { debouncedUpdate } \= useUpdateNotificationPreferences()

  \<Switch  
    value={preferences.booking\_alerts}  
    onValueChange={(val) \=\> debouncedUpdate({ booking\_alerts: val })}  
  /\>

  ── CONSTRAINTS ────────────────────────────────────────────────────────────  
  \- Debounce prevents firing a PATCH on every rapid toggle state change  
  \- The 500ms debounce means the PATCH fires 500ms after the user  
    finishes toggling — fast repeated taps only generate one request  
  \- DEFAULT\_PREFERENCES merged with API response ensures all keys are  
    always present even if the server omits newly added preference keys  
  \- Do NOT validate booleans client-side — the API enforces the type  
\*/  
\`\`\`

