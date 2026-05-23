import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ElderRelativeContact } from "@/types/elder-dashboard";

import { ELDER_COLORS, ELDER_RADIUS, ELDER_SHADOW } from "../theme";

interface RelativeContactCardProps {
  relative: ElderRelativeContact;
  onPress: () => void;
}

function RelativeContactCard({ relative, onPress }: RelativeContactCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{relative.avatarLabel}</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.kicker}>Quick contact</Text>
          <Text style={styles.name}>{relative.name}</Text>
          <Text style={styles.meta}>{relative.relationship}</Text>
          <Text style={styles.reassurance}>{relative.reassurance}</Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={relative.phoneLabel}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="call" size={20} color={ELDER_COLORS.surface} />
        <Text style={styles.buttonText}>{relative.phoneLabel}</Text>
      </Pressable>
    </View>
  );
}

export default memo(RelativeContactCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: ELDER_COLORS.surface,
    borderRadius: ELDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    padding: 18,
    marginBottom: 16,
    ...ELDER_SHADOW,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ELDER_COLORS.surfaceSoft,
  },
  avatarText: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  kicker: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  name: {
    color: ELDER_COLORS.text,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
  },
  meta: {
    color: ELDER_COLORS.textSoft,
    fontSize: 15,
    fontWeight: "700",
  },
  reassurance: {
    color: ELDER_COLORS.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    marginTop: 4,
  },
  button: {
    marginTop: 16,
    minHeight: 58,
    borderRadius: ELDER_RADIUS.pill,
    backgroundColor: ELDER_COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonPressed: {
    opacity: 0.95,
  },
  buttonText: {
    color: ELDER_COLORS.surface,
    fontSize: 16,
    fontWeight: "900",
  },
});
