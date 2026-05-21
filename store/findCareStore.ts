import { create } from "zustand";

import {
  FindCareFilters,
  FindCareSheetMode,
  FindCareViewMode,
} from "@/types/find-care";

interface FindCareStore {
  searchQuery: string;
  selectedElderId: string;
  selectedCaregiverId: string | null;
  viewMode: FindCareViewMode;
  sheetMode: FindCareSheetMode;
  isFilterModalOpen: boolean;
  isDetailModalOpen: boolean;
  filters: FindCareFilters;
  setSearchQuery: (query: string) => void;
  setSelectedElderId: (elderId: string) => void;
  setSelectedCaregiverId: (caregiverId: string | null) => void;
  setViewMode: (viewMode: FindCareViewMode) => void;
  setSheetMode: (sheetMode: FindCareSheetMode) => void;
  setFilterModalOpen: (isOpen: boolean) => void;
  setDetailModalOpen: (isOpen: boolean) => void;
  updateFilters: (filters: Partial<FindCareFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: FindCareFilters = {
  rateRange: [15, 45],
  minRating: 4.5,
  availability: ["available-now"],
  careTypes: ["Medical Care"],
  languages: [],
  yearsExperience: 3,
  distanceRadius: 10,
  sortBy: "nearest",
};

export const useFindCareStore = create<FindCareStore>((set) => ({
  searchQuery: "",
  selectedElderId: "elder-elena",
  selectedCaregiverId: null,
  viewMode: "map",
  sheetMode: "preview",
  isFilterModalOpen: false,
  isDetailModalOpen: false,
  filters: defaultFilters,
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedElderId: (selectedElderId) => set({ selectedElderId }),
  setSelectedCaregiverId: (selectedCaregiverId) => set({ selectedCaregiverId }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSheetMode: (sheetMode) => set({ sheetMode }),
  setFilterModalOpen: (isFilterModalOpen) => set({ isFilterModalOpen }),
  setDetailModalOpen: (isDetailModalOpen) => set({ isDetailModalOpen }),
  updateFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));


