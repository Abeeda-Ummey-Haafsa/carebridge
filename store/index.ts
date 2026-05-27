import { create } from "zustand";
import { User, UserRole } from "@/types/db";

import { DriverStore, LocationStore, MarkerData } from "@/types/type";

export const useUserStore = create<{
  user: User | null;
  role: UserRole | null;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  clearUser: () => void;
  clearRole: () => void;
}>((set) => ({
  user: null,
  role: null,
  setUser: (user: User) => set({ user }),
  setRole: (role: UserRole) => set({ role }),
  clearUser: () => set({ user: null }),
  clearRole: () => set({ role: null }),
}));

export const useLocationStore = create<LocationStore>((set) => ({
  userLatitude: null,
  userLongitude: null,
  userAddress: null,
  destinationLatitude: null,
  destinationLongitude: null,
  destinationAddress: null,
  setUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    set(() => ({
      userLatitude: latitude,
      userLongitude: longitude,
      userAddress: address,
    }));

    // if driver is selected and now new location is set, clear the selected driver
    const { selectedDriver, clearSelectedDriver } = useDriverStore.getState();
    if (selectedDriver) clearSelectedDriver();
  },

  setDestinationLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    set(() => ({
      destinationLatitude: latitude,
      destinationLongitude: longitude,
      destinationAddress: address,
    }));

    // if driver is selected and now new location is set, clear the selected driver
    const { selectedDriver, clearSelectedDriver } = useDriverStore.getState();
    if (selectedDriver) clearSelectedDriver();
  },
}));

export const useDriverStore = create<DriverStore>((set) => ({
  drivers: [] as MarkerData[],
  selectedDriver: null,
  setSelectedDriver: (driverId: number) =>
    set(() => ({ selectedDriver: driverId })),
  setDrivers: (drivers: MarkerData[]) => set(() => ({ drivers })),
  clearSelectedDriver: () => set(() => ({ selectedDriver: null })),
}));

export * from "./relativeDashboardStore";
export * from "./elderDashboardStore";
export * from "./relativeProfileStore";
export * from "./relativeSessionsStore";
