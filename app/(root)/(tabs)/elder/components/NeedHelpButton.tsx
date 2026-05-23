import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ELDER_COLORS, ELDER_RADIUS, ELDER_SHADOW } from "../theme";

interface NeedHelpButtonProps {
  busy: boolean;
  onPress: () => void;
}

function NeedHelpButton({ busy, onPress }: NeedHelpButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={busy ? "Sending help request" : "I need help"}
      accessibilityHint="Opens a confirmation screen for non-emergency support"
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="help-circle"
            size={28}
            color={ELDER_COLORS.primaryDark}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>
            {busy ? "Sending..." : "I Need Help"}
          </Text>
          <Text style={styles.subLabel}>
            {busy ? "Requesting support" : "For family or caregiver help"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(NeedHelpButton);

const styles = StyleSheet.create({
  button: {
    minHeight: 88,
    borderRadius: ELDER_RADIUS.xl,
    backgroundColor: ELDER_COLORS.surface,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 18,
    ...ELDER_SHADOW,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELDER_COLORS.primarySoft,
  },
  copy: {
    flex: 1,
  },
  label: {
    color: ELDER_COLORS.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  subLabel: {
    color: ELDER_COLORS.textSoft,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    marginTop: 2,
  },
});
