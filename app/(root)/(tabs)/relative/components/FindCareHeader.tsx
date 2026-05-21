import React, { memo, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";
import {
  FindCareElderOption,
  FindCareSheetMode,
  FindCareViewMode,
} from "@/types/find-care";

interface FindCareHeaderProps {
  searchQuery: string;
  selectedElder: FindCareElderOption;
  elderOptions: FindCareElderOption[];
  viewMode: FindCareViewMode;
  sheetMode: FindCareSheetMode;
  quickFilters: string[];
  onSearchQueryChange: (value: string) => void;
  onOpenFilters: () => void;
  onToggleViewMode: () => void;
  onCenterLocation: () => void;
  onOpenNotifications: () => void;
  onSelectElder: (elderId: string) => void;
}

function FindCareHeader({
  searchQuery,
  selectedElder,
  elderOptions,
  viewMode,
  sheetMode,
  quickFilters,
  onSearchQueryChange,
  onOpenFilters,
  onToggleViewMode,
  onCenterLocation,
  onOpenNotifications,
  onSelectElder,
}: FindCareHeaderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    const compact = sheetMode === "detail" ? 1 : 0;
    return {
      transform: [{ translateY: interpolate(compact, [0, 1], [0, -4]) }],
      opacity: interpolate(compact, [0, 1], [1, 0.98]),
    };
  }, [sheetMode]);

  const searchShellStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [1, 1.01]) }],
    borderColor: focusProgress.value
      ? RELATIVE_COLORS.teal
      : RELATIVE_COLORS.border,
  }));

  const elderLabel = useMemo(
    () => `${selectedElder.name} · ${selectedElder.relationship}`,
    [selectedElder],
  );

  return (
    <Animated.View style={[styles.shell, headerStyle]}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.elderButton}
          onPress={() => onSelectElder(selectedElder.id)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{selectedElder.avatarLabel}</Text>
          </View>
          <View style={styles.elderCopy}>
            <Text style={styles.elderLabel}>Active elder</Text>
            <Text style={styles.elderName} numberOfLines={1}>
              {elderLabel}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={18}
            color={RELATIVE_COLORS.deepTeal}
          />
        </Pressable>

        <View style={styles.iconRow}>
          <Pressable style={styles.iconButton} onPress={onToggleViewMode}>
            <Ionicons
              name={viewMode === "map" ? "layers-outline" : "map-outline"}
              size={18}
              color={RELATIVE_COLORS.deepTeal}
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onCenterLocation}>
            <Ionicons
              name="navigate-outline"
              size={18}
              color={RELATIVE_COLORS.deepTeal}
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onOpenNotifications}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={RELATIVE_COLORS.deepTeal}
            />
          </Pressable>
        </View>
      </View>

      <Animated.View style={[styles.searchShell, searchShellStyle]}>
        <Ionicons name="search" size={18} color={RELATIVE_COLORS.muted} />
        <TextInput
          value={searchQuery}
          placeholder="Search caregivers or care types"
          placeholderTextColor={RELATIVE_COLORS.soft}
          style={styles.searchInput}
          onChangeText={onSearchQueryChange}
          onFocus={() => {
            setIsFocused(true);
            focusProgress.value = withTiming(1, { duration: 180 });
          }}
          onBlur={() => {
            setIsFocused(false);
            focusProgress.value = withTiming(0, { duration: 180 });
          }}
          accessibilityLabel="Search caregivers or care types"
        />
        <Pressable style={styles.filterButton} onPress={onOpenFilters}>
          <Ionicons
            name="options-outline"
            size={18}
            color={RELATIVE_COLORS.tealDark}
          />
        </Pressable>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {quickFilters.map((chip) => (
          <Pressable key={chip} style={styles.chip} onPress={onOpenFilters}>
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable
        style={styles.selectorRail}
        onPress={() => onSelectElder(selectedElder.id)}
      >
        <Ionicons
          name="pulse-outline"
          size={16}
          color={RELATIVE_COLORS.tealDark}
        />
        <Text style={styles.selectorText}>
          Tracking {elderOptions.length} elder profile
          {elderOptions.length === 1 ? "" : "s"}
        </Text>
      </Pressable>

      <Modal
        transparent
        visible={isFocused}
        animationType="fade"
        onRequestClose={() => setIsFocused(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsFocused(false)}
        />
      </Modal>
    </Animated.View>
  );
}

export default memo(FindCareHeader);

const styles = StyleSheet.create({
  shell: {
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  elderButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: RELATIVE_RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...RELATIVE_SHADOW,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  avatarText: {
    color: RELATIVE_COLORS.tealDark,
    fontWeight: "800",
    fontSize: 12,
  },
  elderCopy: {
    flex: 1,
  },
  elderLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  elderName: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  iconRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surface,
    ...RELATIVE_SHADOW,
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: RELATIVE_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...RELATIVE_SHADOW,
  },
  searchInput: {
    flex: 1,
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  chipRow: {
    gap: 10,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: RELATIVE_COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
  chipText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 12,
    fontWeight: "800",
  },
  selectorRail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectorText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,18,24,0.08)",
  },
});
