import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import MapView, { Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFindCareStore } from "@/store/findCareStore";
import { useRelativeDashboardStore } from "@/store/relativeDashboardStore";
import {
  RELATIVE_COLORS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "./theme";
import { RELATIVE_ELDERS } from "./data";
import { FindCareBookingPreview, FindCareCaregiver } from "@/types/find-care";

import BookingPreviewCard from "./components/BookingPreviewCard";
import CaregiverCard from "./components/CaregiverCard";
import CaregiverDetailModal from "./components/CaregiverDetailModal";
import CaregiverMap from "./components/CaregiverMap";
import FilterModal from "./components/FilterModal";
import FindCareHeader from "./components/FindCareHeader";
import FindCareSkeleton from "./components/FindCareSkeleton";

const elderLocation = {
  latitude: 40.7448,
  longitude: -73.9854,
};

const FIND_CARE_ELDERS = RELATIVE_ELDERS.map((elder) => ({
  id: elder.id,
  name: elder.name,
  relationship: elder.relationship,
  avatarLabel: elder.avatarLabel,
}));

const FIND_CARE_QUICK_FILTERS = [
  "Available Now",
  "Top Rated",
  "Nearby",
  "Medical Care",
  "Mobility Assistance",
  "Overnight Care",
];

const FIND_CARE_CARE_TYPES = [
  "Medical Care",
  "Companionship",
  "Mobility Assistance",
  "Overnight Care",
  "Post-Surgery Care",
  "Medication Support",
];

const FIND_CARE_LANGUAGES = ["English", "Bangla", "Spanish", "Hindi", "Arabic"];

const FIND_CARE_DEFAULT_REGION = {
  latitude: 40.744,
  longitude: -73.985,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const FIND_CARE_CAREGIVERS: FindCareCaregiver[] = [
  {
    id: "caregiver-ava-thompson",
    name: "Ava Thompson",
    avatarLabel: "AT",
    rating: 4.9,
    reviewCount: 128,
    hourlyRate: 28,
    experienceYears: 6,
    specializations: ["Medical Care", "Medication Support", "Mobility"],
    distanceMiles: 1.2,
    etaMinutes: 12,
    languages: ["English", "Spanish"],
    availability: "available-now",
    isHighlyRated: true,
    isNearby: true,
    bio: "Registered caregiver with a calm bedside manner and a strong focus on medication routines, recovery support, and wellness checks.",
    certifications: ["CPR", "First Aid", "Home Health Aide"],
    completedSessions: 412,
    serviceRadiusMiles: 8,
    coordinate: { latitude: 40.742, longitude: -73.991 },
    availabilityWindow: "Today, 8:00 AM - 8:00 PM",
    careTypes: ["Medical Care", "Mobility Assistance", "Medication Support"],
    routeLabel: "12 min arrival",
    reviews: [
      {
        id: "review-ava-1",
        author: "Elena Rodriguez",
        rating: 5,
        comment: "Very attentive, calm, and clear during medication support.",
        timestamp: "2 weeks ago",
      },
      {
        id: "review-ava-2",
        author: "Family member",
        rating: 4.9,
        comment:
          "Kept us updated throughout the session with reassuring detail.",
        timestamp: "1 month ago",
      },
    ],
  },
  {
    id: "caregiver-priya-nair",
    name: "Priya Nair",
    avatarLabel: "PN",
    rating: 4.8,
    reviewCount: 97,
    hourlyRate: 24,
    experienceYears: 5,
    specializations: ["Companionship", "Overnight Care", "Wellness"],
    distanceMiles: 1.8,
    etaMinutes: 16,
    languages: ["English", "Hindi"],
    availability: "scheduled",
    isHighlyRated: true,
    isNearby: true,
    bio: "Friendly caregiver known for structured routines, companionship, and smooth handoffs for evening and overnight support.",
    certifications: ["CPR", "Dementia Care"],
    completedSessions: 278,
    serviceRadiusMiles: 10,
    coordinate: { latitude: 40.746, longitude: -73.982 },
    availabilityWindow: "Today, 4:00 PM - 11:00 PM",
    careTypes: ["Companionship", "Overnight Care", "Medical Care"],
    routeLabel: "16 min arrival",
    reviews: [
      {
        id: "review-priya-1",
        author: "Arthur Pendelton",
        rating: 4.8,
        comment: "Really thoughtful and proactive with check-ins and comfort.",
        timestamp: "6 days ago",
      },
    ],
  },
  {
    id: "caregiver-nora-williams",
    name: "Nora Williams",
    avatarLabel: "NW",
    rating: 4.7,
    reviewCount: 84,
    hourlyRate: 22,
    experienceYears: 4,
    specializations: ["Mobility Assistance", "Post-Surgery Care"],
    distanceMiles: 2.3,
    etaMinutes: 19,
    languages: ["English"],
    availability: "available-now",
    isHighlyRated: false,
    isNearby: true,
    bio: "Hands-on caregiver who supports mobility, transfers, and rehab routines with a safety-first approach.",
    certifications: ["Transfer Safety", "CPR"],
    completedSessions: 215,
    serviceRadiusMiles: 7,
    coordinate: { latitude: 40.7395, longitude: -73.998 },
    availabilityWindow: "Tonight, 6:00 PM - 10:00 PM",
    careTypes: ["Mobility Assistance", "Post-Surgery Care"],
    routeLabel: "19 min arrival",
    reviews: [
      {
        id: "review-nora-1",
        author: "Maria Chen",
        rating: 4.7,
        comment:
          "Patient, reassuring, and especially good with transfer support.",
        timestamp: "3 days ago",
      },
    ],
  },
  {
    id: "caregiver-samira-ahmed",
    name: "Samira Ahmed",
    avatarLabel: "SA",
    rating: 4.9,
    reviewCount: 141,
    hourlyRate: 30,
    experienceYears: 8,
    specializations: ["Medical Care", "Overnight Care", "Medication"],
    distanceMiles: 3.1,
    etaMinutes: 24,
    languages: ["English", "Bangla", "Arabic"],
    availability: "available-now",
    isHighlyRated: true,
    isNearby: false,
    bio: "Premium care specialist with a hospital background and strong experience in overnight medical support.",
    certifications: ["RN Assistant", "CPR", "Clinical Support"],
    completedSessions: 531,
    serviceRadiusMiles: 12,
    coordinate: { latitude: 40.751, longitude: -73.977 },
    availabilityWindow: "Today, 10:00 AM - 9:00 PM",
    careTypes: ["Medical Care", "Overnight Care", "Medication Support"],
    routeLabel: "24 min arrival",
    reviews: [
      {
        id: "review-samira-1",
        author: "Relative",
        rating: 5,
        comment:
          "Very professional, efficient, and clear on all health updates.",
        timestamp: "1 week ago",
      },
    ],
  },
  {
    id: "caregiver-michael-owens",
    name: "Michael Owens",
    avatarLabel: "MO",
    rating: 4.6,
    reviewCount: 62,
    hourlyRate: 20,
    experienceYears: 3,
    specializations: ["Companionship", "Light Support"],
    distanceMiles: 4.4,
    etaMinutes: 29,
    languages: ["English", "French"],
    availability: "offline",
    isHighlyRated: false,
    isNearby: false,
    bio: "Warm and reliable caregiver ideal for companionship, check-ins, and lighter support schedules.",
    certifications: ["Companion Care"],
    completedSessions: 108,
    serviceRadiusMiles: 6,
    coordinate: { latitude: 40.735, longitude: -73.969 },
    availabilityWindow: "Tomorrow, 9:00 AM - 5:00 PM",
    careTypes: ["Companionship", "Medical Care"],
    routeLabel: "29 min arrival",
    reviews: [
      {
        id: "review-michael-1",
        author: "Family member",
        rating: 4.6,
        comment: "Excellent companion care and very easy to coordinate with.",
        timestamp: "2 weeks ago",
      },
    ],
  },
];

export default function FindCareScreen() {
  const mapRef = useRef<MapView>(null);
  const { unreadNotifications } = useRelativeDashboardStore();
  const {
    searchQuery,
    selectedElderId,
    selectedCaregiverId,
    viewMode,
    sheetMode,
    filters,
    isFilterModalOpen,
    isDetailModalOpen,
    setSearchQuery,
    setSelectedElderId,
    setSelectedCaregiverId,
    setViewMode,
    setSheetMode,
    setFilterModalOpen,
    setDetailModalOpen,
    updateFilters,
    resetFilters,
  } = useFindCareStore();

  const [loading, setLoading] = useState(true);
  const [elderPickerOpen, setElderPickerOpen] = useState(false);
  const [locationPermission, setLocationPermission] = useState<
    "loading" | "granted" | "blocked"
  >("loading");
  const [currentRegion, setCurrentRegion] = useState<Region>(
    FIND_CARE_DEFAULT_REGION,
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function requestLocation() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) {
          return;
        }

        if (permission.granted) {
          setLocationPermission("granted");
          const current = await Location.getCurrentPositionAsync({});
          if (!active) {
            return;
          }

          const region = {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          };

          setCurrentRegion(region);
          mapRef.current?.animateToRegion(region, 800);
        } else {
          setLocationPermission("blocked");
        }
      } catch {
        if (active) {
          setLocationPermission("blocked");
        }
      }
    }

    requestLocation();

    return () => {
      active = false;
    };
  }, []);

  const selectedElder = useMemo(
    () =>
      RELATIVE_ELDERS.find((elder) => elder.id === selectedElderId) ??
      RELATIVE_ELDERS[0],
    [selectedElderId],
  );

  const filteredCaregivers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let caregivers = FIND_CARE_CAREGIVERS.filter((caregiver) => {
      const matchesQuery =
        query.length === 0 ||
        caregiver.name.toLowerCase().includes(query) ||
        caregiver.specializations.some((item: string) =>
          item.toLowerCase().includes(query),
        ) ||
        caregiver.careTypes.some((item: string) =>
          item.toLowerCase().includes(query),
        );

      const matchesRate =
        caregiver.hourlyRate >= filters.rateRange[0] &&
        caregiver.hourlyRate <= filters.rateRange[1];
      const matchesRating = caregiver.rating >= filters.minRating;
      const matchesAvailability =
        filters.availability.length === 0 ||
        filters.availability.includes(caregiver.availability);
      const matchesCareType =
        filters.careTypes.length === 0 ||
        caregiver.careTypes.some((item: string) =>
          filters.careTypes.includes(item),
        );
      const matchesLanguage =
        filters.languages.length === 0 ||
        caregiver.languages.some((item: string) =>
          filters.languages.includes(item),
        );
      const matchesExperience =
        caregiver.experienceYears >= filters.yearsExperience;
      const matchesDistance = caregiver.distanceMiles <= filters.distanceRadius;

      return (
        matchesQuery &&
        matchesRate &&
        matchesRating &&
        matchesAvailability &&
        matchesCareType &&
        matchesLanguage &&
        matchesExperience &&
        matchesDistance
      );
    });

    caregivers = caregivers.sort(
      (
        first: (typeof FIND_CARE_CAREGIVERS)[number],
        second: (typeof FIND_CARE_CAREGIVERS)[number],
      ) => {
        switch (filters.sortBy) {
          case "highest-rated":
            return second.rating - first.rating;
          case "lowest-price":
            return first.hourlyRate - second.hourlyRate;
          case "fastest-arrival":
            return first.etaMinutes - second.etaMinutes;
          default:
            return first.distanceMiles - second.distanceMiles;
        }
      },
    );

    return caregivers;
  }, [filters, searchQuery]);

  useEffect(() => {
    if (!selectedCaregiverId && filteredCaregivers.length > 0) {
      setSelectedCaregiverId(filteredCaregivers[0].id);
      setSheetMode("preview");
    }
  }, [
    filteredCaregivers,
    selectedCaregiverId,
    setSelectedCaregiverId,
    setSheetMode,
  ]);

  const selectedCaregiver = useMemo(
    () =>
      filteredCaregivers.find(
        (caregiver: (typeof FIND_CARE_CAREGIVERS)[number]) =>
          caregiver.id === selectedCaregiverId,
      ) ??
      filteredCaregivers[0] ??
      null,
    [filteredCaregivers, selectedCaregiverId],
  );

  const bookingPreview = useMemo<FindCareBookingPreview | null>(() => {
    if (!selectedCaregiver) {
      return null;
    }

    const careType = selectedCaregiver.careTypes[0] ?? "Medical Care";
    const durationHours =
      selectedCaregiver.availability === "available-now" ? 2 : 3;
    const estimatedCost = selectedCaregiver.hourlyRate * durationHours + 8;

    return {
      caregiverId: selectedCaregiver.id,
      careType,
      durationHours,
      estimatedCost,
      estimatedArrival: selectedCaregiver.routeLabel,
    };
  }, [selectedCaregiver]);

  const handleCenterLocation = useCallback(() => {
    mapRef.current?.animateToRegion(currentRegion, 700);
  }, [currentRegion]);

  const handleSelectCaregiver = useCallback(
    (caregiverId: string) => {
      setSelectedCaregiverId(caregiverId);
      setSheetMode("preview");
      const caregiver = filteredCaregivers.find(
        (item: (typeof FIND_CARE_CAREGIVERS)[number]) =>
          item.id === caregiverId,
      );
      if (caregiver) {
        mapRef.current?.animateToRegion(
          {
            latitude: caregiver.coordinate.latitude,
            longitude: caregiver.coordinate.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          650,
        );
      }
    },
    [filteredCaregivers, setSelectedCaregiverId, setSheetMode],
  );

  const handleBookNow = useCallback(() => {
    setDetailModalOpen(false);
    Alert.alert(
      "Continue booking",
      "This screen hands off to the next booking step in the existing ride flow.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => router.push("/(root)/confirm-ride"),
        },
      ],
    );
  }, [setDetailModalOpen]);

  const handleOpenDetail = useCallback(
    (caregiverId: string) => {
      setSelectedCaregiverId(caregiverId);
      setDetailModalOpen(true);
      setSheetMode("detail");
    },
    [setDetailModalOpen, setSelectedCaregiverId, setSheetMode],
  );

  const openBookingFromCard = useCallback(
    (caregiverId: string) => {
      setSelectedCaregiverId(caregiverId);
      handleBookNow();
    },
    [handleBookNow, setSelectedCaregiverId],
  );

  const openNotifications = useCallback(() => {
    Alert.alert(
      "Notifications",
      `${unreadNotifications} unread updates are available.`,
    );
  }, [unreadNotifications]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <FindCareSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.screenShell}>
        <View style={styles.mapWrap}>
          <CaregiverMap
            ref={mapRef}
            caregivers={filteredCaregivers}
            selectedCaregiverId={selectedCaregiver?.id ?? null}
            elderLocation={elderLocation}
            currentRegion={currentRegion}
            onSelectCaregiver={handleSelectCaregiver}
            onMapReady={handleCenterLocation}
          />

          <View style={styles.mapScrimTop} />
          <View style={styles.mapScrimBottom} />

          <View style={styles.headerWrap}>
            <FindCareHeader
              searchQuery={searchQuery}
              selectedElder={{
                id: selectedElder.id,
                name: selectedElder.name,
                relationship: selectedElder.relationship,
                avatarLabel: selectedElder.avatarLabel,
              }}
              elderOptions={FIND_CARE_ELDERS}
              viewMode={viewMode}
              sheetMode={sheetMode}
              quickFilters={FIND_CARE_QUICK_FILTERS}
              onSearchQueryChange={setSearchQuery}
              onOpenFilters={() => setFilterModalOpen(true)}
              onToggleViewMode={() =>
                setViewMode(viewMode === "map" ? "list" : "map")
              }
              onCenterLocation={handleCenterLocation}
              onOpenNotifications={openNotifications}
              onSelectElder={() => setElderPickerOpen(true)}
            />
          </View>

          {locationPermission === "blocked" ? (
            <View style={styles.locationBanner}>
              <Text style={styles.locationBannerTitle}>
                Location is disabled
              </Text>
              <Text style={styles.locationBannerText}>
                Enable location access to see the closest caregivers and the
                route preview.
              </Text>
            </View>
          ) : null}

          {selectedCaregiver ? (
            <View style={styles.previewWrap}>
              <BookingPreviewCard
                caregiver={selectedCaregiver}
                preview={bookingPreview}
                onBookNow={handleBookNow}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.listShell}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>
                {filteredCaregivers.length} nearby caregiver
                {filteredCaregivers.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.listSubtitle}>
                Compare availability, ratings, and service fit.
              </Text>
            </View>
            <Pressable
              style={styles.listToggle}
              onPress={() =>
                setSheetMode(sheetMode === "list" ? "preview" : "list")
              }
            >
              <Text style={styles.listToggleText}>
                {sheetMode === "list" ? "Compact" : "Expand"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.cardRail}>
            {filteredCaregivers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  No caregivers match these filters.
                </Text>
                <Text style={styles.emptyText}>
                  Try widening the radius or resetting the search query.
                </Text>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    setSearchQuery("");
                    resetFilters();
                  }}
                >
                  <Text style={styles.emptyButtonText}>Reset filters</Text>
                </Pressable>
              </View>
            ) : (
              filteredCaregivers.map(
                (
                  caregiver: (typeof FIND_CARE_CAREGIVERS)[number],
                  index: number,
                ) => (
                  <CaregiverCard
                    key={caregiver.id}
                    caregiver={caregiver}
                    index={index}
                    selected={caregiver.id === selectedCaregiver?.id}
                    onPress={handleSelectCaregiver}
                    onViewProfile={handleOpenDetail}
                    onBookNow={openBookingFromCard}
                    onToggleFavorite={(caregiverId) =>
                      Alert.alert(
                        "Saved",
                        `${caregiverId} would be added to favorites here.`,
                      )
                    }
                  />
                ),
              )
            )}
          </View>
        </View>
      </View>

      <FilterModal
        visible={isFilterModalOpen}
        filters={filters}
        careTypes={FIND_CARE_CARE_TYPES}
        languages={FIND_CARE_LANGUAGES}
        onClose={() => setFilterModalOpen(false)}
        onApply={updateFilters}
        onReset={resetFilters}
      />

      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        visible={isDetailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onBookNow={handleBookNow}
      />

      <Modal
        transparent
        visible={elderPickerOpen}
        animationType="fade"
        onRequestClose={() => setElderPickerOpen(false)}
      >
        <Pressable
          style={styles.pickerBackdrop}
          onPress={() => setElderPickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Choose elder</Text>
            {FIND_CARE_ELDERS.map((elder) => (
              <Pressable
                key={elder.id}
                style={[
                  styles.pickerRow,
                  elder.id === selectedElder.id && styles.pickerRowActive,
                ]}
                onPress={() => {
                  setSelectedElderId(elder.id);
                  setElderPickerOpen(false);
                }}
              >
                <View style={styles.pickerAvatar}>
                  <Text style={styles.pickerAvatarText}>
                    {elder.avatarLabel}
                  </Text>
                </View>
                <View style={styles.pickerCopy}>
                  <Text style={styles.pickerName}>{elder.name}</Text>
                  <Text style={styles.pickerSub}>{elder.relationship}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {Platform.OS !== "web" && viewMode === "map" ? (
        <View pointerEvents="none" style={styles.bottomGlow} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RELATIVE_COLORS.screen,
  },
  screenShell: {
    flex: 1,
  },
  mapWrap: {
    flex: 1,
    margin: 16,
    borderRadius: RELATIVE_RADIUS.xl,
    overflow: "hidden",
    backgroundColor: RELATIVE_COLORS.surface,
    ...StyleSheet.absoluteFillObject,
  },
  mapScrimTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(246,251,252,0.55)",
  },
  mapScrimBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 240,
    backgroundColor: "rgba(246,251,252,0.68)",
  },
  headerWrap: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
  },
  previewWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 190,
  },
  locationBanner: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 124,
    padding: 14,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
    ...RELATIVE_SHADOW,
  },
  locationBannerTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },
  locationBannerText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  listShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 330,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "rgba(246,251,252,0.96)",
    borderTopWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 18,
    paddingBottom: 14,
  },
  listTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  listSubtitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  listToggle: {
    backgroundColor: RELATIVE_COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  listToggleText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 12,
    fontWeight: "800",
  },
  cardRail: {
    gap: 12,
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingBottom: 26,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 20,
    minHeight: 160,
    ...RELATIVE_SHADOW,
  },
  emptyTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 14,
    backgroundColor: RELATIVE_COLORS.teal,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,18,24,0.28)",
    justifyContent: "center",
    padding: 20,
  },
  pickerCard: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.xl,
    padding: 16,
    ...RELATIVE_SHADOW,
  },
  pickerTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: RELATIVE_RADIUS.lg,
    padding: 12,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    marginBottom: 10,
  },
  pickerRowActive: {
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  pickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: RELATIVE_COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerAvatarText: {
    color: RELATIVE_COLORS.deepTeal,
    fontWeight: "900",
  },
  pickerCopy: {
    flex: 1,
  },
  pickerName: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  pickerSub: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  bottomGlow: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    height: 70,
    borderRadius: 999,
    backgroundColor: "rgba(31,178,153,0.14)",
  },
});
