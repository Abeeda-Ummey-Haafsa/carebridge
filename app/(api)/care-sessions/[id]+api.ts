import { requireCaregiver, ApiAuthError } from "@/lib/server-auth";
import { db } from "@/lib/db";
import type { CareSession, Elder, Caregiver } from "@/types/db";

interface SessionDetail {
  id: number;
  care_type: string;
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "arriving"
    | "checked_in"
    | "paused"
    | "completed"
    | "cancelled";
  is_immediate: boolean;
  scheduled_at: string;
  duration_minutes: number;
  hourly_rate: number;
  total_cost: number | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  actual_duration_minutes: number | null;
  elder_address: string | null;
  elder_lat: number | null;
  elder_lng: number | null;
  created_at: string;
  updated_at: string;
}

interface ElderDetail {
  id: number;
  user_id: number;
  name: string;
  age: number | null;
  date_of_birth: string | null;
  medical_notes: string | null;
  allergies: string | null;
  mobility_level:
    | "independent"
    | "walker"
    | "wheelchair"
    | "assisted"
    | "dependent"
    | null;
  preferred_languages: string[];
  home_address: string | null;
  home_lat: number | null;
  home_lng: number | null;
}

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
}

interface NotePreview {
  id: number;
  content: string;
  note_type: string;
  created_at: string;
  author_name: string;
}

interface PaymentRecord {
  id: number;
  amount: number;
  status: string;
  currency: string;
  paid_at: string | null;
}

interface SessionFetchResponse {
  success: boolean;
  data: {
    session: SessionDetail;
    elder: ElderDetail;
    emergency_contacts: EmergencyContact[];
    caregiver_location: { lat: number | null; lng: number | null };
    tasks: {
      total: number;
      completed: number;
    };
    notes: NotePreview[];
    payment: PaymentRecord | null;
  };
}

function computeAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  try {
    // Step 1: parse param
    const sessionId = parseInt(params.id, 10);
    if (isNaN(sessionId)) {
      return Response.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Step 2: authenticate
    const { caregiver } = await requireCaregiver(request);

    // Step 3: main JOIN query
    const rows = await db<any>`
      SELECT
        cs.id, cs.elder_id, cs.caregiver_id, cs.booked_by_user_id,
        cs.care_type, cs.is_immediate, cs.status,
        cs.scheduled_at, cs.duration_minutes, cs.hourly_rate, cs.total_cost,
        cs.elder_address, cs.elder_lat, cs.elder_lng,
        cs.checked_in_at, cs.checked_out_at, cs.actual_duration_minutes,
        cs.created_at, cs.updated_at,
        e.id AS elder_profile_id,
        e.date_of_birth,
        e.medical_notes,
        e.allergies,
        e.mobility_level,
        e.preferred_languages,
        e.home_address,
        e.home_lat,
        e.home_lng,
        u.id AS elder_user_id,
        u.name AS elder_name,
        u.email AS elder_email,
        cg.current_lat AS caregiver_current_lat,
        cg.current_lng AS caregiver_current_lng
      FROM care_sessions cs
      JOIN elders e ON cs.elder_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN caregivers cg ON cs.caregiver_id = cg.id
      WHERE cs.id = ${sessionId}
      LIMIT 1
    `;

    // Step 4: not found check
    if (rows.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }
    const sessionRow = rows[0];

    // Step 5: ownership guard
    if (sessionRow.caregiver_id !== caregiver.id) {
      return Response.json(
        { error: "You do not have access to this session" },
        { status: 403 },
      );
    }

    // Step 6: emergency contacts query
    const emergencyContacts = await db<EmergencyContact>`
      SELECT id, name, phone, relationship, is_primary
      FROM elder_emergency_contacts
      WHERE elder_id = ${sessionRow.elder_profile_id}
      ORDER BY is_primary DESC, id ASC
    `;

    // Step 7: parallel extended detail queries
    const [tasksResult, notesResult, paymentResult] = await Promise.all([
      db<any>`
        SELECT
          COUNT(*)                                   AS total_tasks,
          COUNT(*) FILTER (WHERE is_completed = true) AS completed_tasks
        FROM session_tasks
        WHERE session_id = ${sessionId}
      `,
      db<NotePreview>`
        SELECT sn.id, sn.content, sn.note_type, sn.created_at,
               u.name AS author_name
        FROM   session_notes sn
        JOIN   users u ON sn.author_user_id = u.id
        WHERE  sn.session_id = ${sessionId}
        ORDER  BY sn.created_at DESC
        LIMIT  5
      `,
      db<PaymentRecord>`
        SELECT id, amount, status, currency, paid_at
        FROM   payments
        WHERE  session_id = ${sessionId}
        LIMIT  1
      `,
    ]);

    // Step 8: compute age
    const elderAge = computeAge(sessionRow.date_of_birth);

    // Step 9: assemble response with null safety
    const session: SessionDetail = {
      id: sessionRow.id,
      care_type: sessionRow.care_type,
      status: sessionRow.status,
      is_immediate: sessionRow.is_immediate,
      scheduled_at: sessionRow.scheduled_at,
      duration_minutes: sessionRow.duration_minutes,
      hourly_rate: sessionRow.hourly_rate,
      total_cost: sessionRow.total_cost,
      checked_in_at: sessionRow.checked_in_at,
      checked_out_at: sessionRow.checked_out_at,
      actual_duration_minutes: sessionRow.actual_duration_minutes,
      elder_address: sessionRow.elder_address,
      elder_lat: sessionRow.elder_lat,
      elder_lng: sessionRow.elder_lng,
      created_at: sessionRow.created_at,
      updated_at: sessionRow.updated_at,
    };

    const elder: ElderDetail = {
      id: sessionRow.elder_profile_id,
      user_id: sessionRow.elder_user_id,
      name: sessionRow.elder_name,
      age: elderAge,
      date_of_birth: sessionRow.date_of_birth,
      medical_notes: sessionRow.medical_notes,
      allergies: sessionRow.allergies,
      mobility_level: sessionRow.mobility_level,
      preferred_languages: sessionRow.preferred_languages || [],
      home_address: sessionRow.home_address,
      home_lat: sessionRow.home_lat,
      home_lng: sessionRow.home_lng,
    };

    const responsePayload: SessionFetchResponse = {
      success: true,
      data: {
        session,
        elder,
        emergency_contacts: emergencyContacts || [],
        caregiver_location: {
          lat: sessionRow.caregiver_current_lat ?? null,
          lng: sessionRow.caregiver_current_lng ?? null,
        },
        tasks: {
          total: parseInt(tasksResult[0]?.total_tasks || "0", 10),
          completed: parseInt(tasksResult[0]?.completed_tasks || "0", 10),
        },
        notes: notesResult || [],
        payment: paymentResult[0] || null,
      },
    };

    return Response.json(responsePayload, { status: 200 });
  } catch (err: any) {
    if (err instanceof ApiAuthError) {
      return Response.json(
        { error: err.message },
        { status: err.statusCode || 401 },
      );
    }
    console.error("[care-sessions/[id] GET]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
