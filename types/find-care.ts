export type FindCareViewMode = "map" | "list";

export type FindCareSheetMode = "preview" | "list" | "detail";

export type FindCareSortOption =
  | "nearest"
  | "highest-rated"
  | "lowest-price"
  | "fastest-arrival";

export type FindCareAvailability = "available-now" | "scheduled" | "offline";

export interface FindCareElderOption {
  id: string;
  name: string;
  relationship: string;
  avatarLabel: string;
}

export interface FindCareCoordinates {
  latitude: number;
  longitude: number;
}

export interface FindCareCaregiverReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface FindCareCaregiver {
  id: string;
  name: string;
  avatarLabel: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  experienceYears: number;
  specializations: string[];
  distanceMiles: number;
  etaMinutes: number;
  languages: string[];
  availability: FindCareAvailability;
  isHighlyRated: boolean;
  isNearby: boolean;
  bio: string;
  certifications: string[];
  completedSessions: number;
  serviceRadiusMiles: number;
  coordinate: FindCareCoordinates;
  availabilityWindow: string;
  careTypes: string[];
  routeLabel: string;
  reviews: FindCareCaregiverReview[];
}

export interface FindCareFilters {
  rateRange: [number, number];
  minRating: number;
  availability: FindCareAvailability[];
  careTypes: string[];
  languages: string[];
  yearsExperience: number;
  distanceRadius: number;
  sortBy: FindCareSortOption;
}

export interface FindCareBookingPreview {
  caregiverId: string;
  careType: string;
  durationHours: number;
  estimatedCost: number;
  estimatedArrival: string;
}
