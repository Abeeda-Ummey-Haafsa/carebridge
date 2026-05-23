import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";

import { SessionSortOption } from "@/store/relativeSessionsStore";
import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "../theme";

interface RelativeSortModalProps {
  visible: boolean;
  currentSort: SessionSortOption;
  onClose: () => void;
  onSortChange: (sort: SessionSortOption) => void;
}

const SORT_OPTIONS: { id: SessionSortOption; label: string }[] = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "highest-payment", label: "Highest Payment" },
  { id: "upcoming-first", label: "Upcoming First" },
  { id: "active-first", label: "Active First" },
];

export const RelativeSortModal: React.FC<RelativeSortModalProps> = ({
  visible,
  currentSort,
  onClose,
  onSortChange,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.title}>Sort Sessions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.optionList}>
            {SORT_OPTIONS.map((option) => {
              const selected = currentSort === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionRow,
                    selected && styles.optionRowSelected,
                  ]}
                  onPress={() => {
                    onSortChange(option.id);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

interface RelativeSearchModalProps {
  visible: boolean;
  initialValue?: string;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export const RelativeSearchModal: React.FC<RelativeSearchModalProps> = ({
  visible,
  initialValue = "",
  onClose,
  onSearch,
}) => {
  const [query, setQuery] = useState(initialValue);

  const hasText = useMemo(() => query.trim().length > 0, [query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlayCenter}>
        <View style={styles.searchPanel}>
          <Text style={styles.title}>Find Session</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.input}
            placeholder="Caregiver, elder, care type, or date"
            placeholderTextColor={RELATIVE_COLORS.soft}
            autoFocus
          />

          <View style={styles.searchActions}>
            <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchBtn, !hasText && styles.searchBtnMuted]}
              onPress={() => {
                onSearch(query.trim());
                onClose();
              }}
            >
              <Text style={styles.searchBtnText}>Apply Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    backgroundColor: RELATIVE_COLORS.screen,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  panelHeader: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: RELATIVE_COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  optionList: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  optionRow: {
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionRowSelected: {
    borderColor: RELATIVE_COLORS.teal,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
  },
  optionText: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  optionTextSelected: {
    color: RELATIVE_COLORS.teal,
  },
  radio: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#d3e5e2",
  },
  radioSelected: {
    backgroundColor: RELATIVE_COLORS.teal,
  },
  overlayCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
  },
  searchPanel: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.screen,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: RELATIVE_COLORS.text,
    fontSize: 14,
  },
  searchActions: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  ghostBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  ghostText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  searchBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  searchBtnMuted: {
    opacity: 0.88,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
