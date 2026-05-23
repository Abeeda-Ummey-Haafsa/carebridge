/**
 * SearchBar Component
 * Reusable search bar for filtering conversations
 */

import React from "react";
import { View, TextInput, Image, StyleSheet, ViewStyle } from "react-native";
import { icons } from "@/constants";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
}

export const SearchBar = ({
  placeholder = "Search conversations...",
  value,
  onChangeText,
  style,
}: SearchBarProps) => {
  return (
    <View style={[styles.container, style]}>
      <Image source={icons.search} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#888",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
});
