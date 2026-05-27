export type UserRole = "caregiver" | "relative" | "elder";

export interface User {
  id: number;
  name: string;
  email: string;
  clerk_id: string;
  role: UserRole;
  created_at: string;
}

export interface Caregiver {
  id: number;
  user_id: number;
  bio: string | null;
  hourly_rate: number | null;
  years_experience: number;
  care_types: string[] | null;
  languages: string[] | null;
  avg_rating: number;
  total_reviews: number;
  is_available: boolean;
  current_lat: number | null;
  current_lng: number | null;
  service_radius_km: number;
  created_at: string;
}

export interface CaregiverCertification {
  id: number;
  caregiver_id: number;
  document_name: string;
  document_url: string;
  verified: boolean;
  uploaded_at: string;
}

export interface CaregiverAvailability {
  id: number;
  caregiver_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Elder {
  id: number;
  user_id: number;
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
  preferred_languages: string[] | null;
  home_address: string | null;
  home_lat: number | null;
  home_lng: number | null;
  created_at: string;
}

export interface ElderRelativeLink {
  id: number;
  elder_id: number;
  relative_user_id: number;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ElderEmergencyContact {
  id: number;
  elder_id: number;
  name: string;
  phone: string;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface CareSession {
  id: number;
  elder_id: number;
  caregiver_id: number;
  booked_by_user_id: number;
  care_type: string;
  is_immediate: boolean;
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "arriving"
    | "checked_in"
    | "paused"
    | "completed"
    | "cancelled";
  scheduled_at: string;
  duration_minutes: number;
  hourly_rate: number;
  total_cost: number | null;
  elder_address: string | null;
  elder_lat: number | null;
  elder_lng: number | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  actual_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface SessionTask {
  id: number;
  session_id: number;
  task_name: string;
  is_completed: boolean;
  notes: string | null;
  is_custom: boolean;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
}

export interface SessionNote {
  id: number;
  session_id: number;
  author_user_id: number;
  content: string;
  note_type:
    | "custom"
    | "medication_given"
    | "elder_resting"
    | "meal_completed"
    | "mobility_assistance"
    | "blood_pressure_checked"
    | "hydration_reminder"
    | "other";
  created_at: string;
}

export interface Payment {
  id: number;
  session_id: number;
  payer_user_id: number;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  paid_at: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  session_id: number;
  reviewer_user_id: number;
  caregiver_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface EmergencyAlert {
  id: number;
  elder_id: number;
  session_id: number | null;
  alert_type: "sos" | "need_help";
  lat: number | null;
  lng: number | null;
  acknowledged_at: string | null;
  acknowledged_by_user_id: number | null;
  created_at: string;
}

export interface Message {
  id: number;
  session_id: number;
  sender_user_id: number;
  content: string;
  message_type: "text" | "system" | "care_update";
  is_read: boolean;
  created_at: string;
}

export interface DeviceToken {
  id: number;
  user_id: number;
  token: string;
  platform: "ios" | "android";
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string | null;
  related_id: number | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CareSessionWithDetails extends CareSession {
  elder_name: string;
  elder_age: number | null;
  caregiver_name: string;
  task_total: number;
  task_completed: number;
}

export interface ConversationSummary {
  session_id: number;
  care_type: string;
  session_status: CareSession["status"];
  other_party_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface EarningsPeriodSummary {
  period: "today" | "week" | "month";
  earnings_total: number;
  session_count: number;
}

export interface EarningsDayBreakdown {
  date: string;
  earnings: number;
  session_count: number;
}
