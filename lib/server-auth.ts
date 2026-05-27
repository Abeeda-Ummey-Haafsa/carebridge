import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export class ApiAuthError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export interface AuthUser {
  id: number;
  clerk_id: string;
  role: "caregiver" | "elder" | "relative";
  name: string;
  email: string;
}

export interface AuthCaregiver {
  id: number;
  user_id: number;
  is_available: boolean;
  hourly_rate: number | null;
  years_experience: number;
  care_types: string[];
  languages: string[];
  avg_rating: number;
  total_reviews: number;
  current_lat: number | null;
  current_lng: number | null;
  service_radius_km: number;
}

export interface CaregiverAuthContext {
  user: AuthUser;
  caregiver: AuthCaregiver;
}

export interface AuthElder {
  id: number;
  user_id: number;
  date_of_birth: string | null;
  medical_notes: string | null;
  allergies: string | null;
  mobility_level: string | null;
  home_lat: number | null;
  home_lng: number | null;
}

export interface ElderAuthContext {
  user: AuthUser;
  elder: AuthElder;
}

export async function getAuthenticatedUser(
  request: Request,
): Promise<AuthUser> {
  const { userId } = await auth();

  if (!userId) throw new ApiAuthError(401, "No active Clerk session");

  const rows = await db<AuthUser>`
    SELECT id, clerk_id, role, name, email
    FROM   users
    WHERE  clerk_id = ${userId}
    LIMIT  1
  `;

  if (rows.length === 0) {
    throw new ApiAuthError(401, "User record not found");
  }

  return rows[0];
}

export async function requireCaregiver(
  request: Request,
): Promise<CaregiverAuthContext> {
  const user = await getAuthenticatedUser(request);

  if (user.role !== "caregiver") {
    throw new ApiAuthError(403, "Access restricted to caregivers");
  }

  const rows = await db<AuthCaregiver>`
    SELECT id, user_id, is_available, hourly_rate, years_experience,
           care_types, languages, avg_rating, total_reviews,
           current_lat, current_lng, service_radius_km
    FROM   caregivers
    WHERE  user_id = ${user.id}
    LIMIT  1
  `;

  if (rows.length === 0) {
    throw new ApiAuthError(403, "Caregiver profile not found");
  }

  return { user, caregiver: rows[0] };
}

export async function requireElder(
  request: Request,
): Promise<ElderAuthContext> {
  const user = await getAuthenticatedUser(request);

  if (user.role !== "elder") {
    throw new ApiAuthError(403, "Access restricted to elders");
  }

  const rows = await db<AuthElder>`
    SELECT id, user_id, date_of_birth, medical_notes, allergies,
           mobility_level, home_lat, home_lng
    FROM   elders
    WHERE  user_id = ${user.id}
    LIMIT  1
  `;

  if (rows.length === 0) {
    throw new ApiAuthError(403, "Elder profile not found");
  }

  return { user, elder: rows[0] };
}
