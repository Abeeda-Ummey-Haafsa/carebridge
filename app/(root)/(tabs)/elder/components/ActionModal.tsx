import { memo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import {
  ELDER_COLORS,
  ELDER_MODAL_TONES,
  ELDER_RADIUS,
  ELDER_SHADOW,
} from "../theme";

type ModalTone = keyof typeof ELDER_MODAL_TONES;

interface ActionModalProps {
  visible: boolean;
  tone: ModalTone;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onDismiss: () => void;
}

function ActionModal({
  visible,
  tone,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onDismiss,
}: ActionModalProps) {
  const modalTone = ELDER_MODAL_TONES[tone];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          entering={FadeInDown.duration(220)}
          exiting={FadeOutDown.duration(140)}
          style={styles.centered}
        >
          <Pressable
            style={[styles.card, { backgroundColor: ELDER_COLORS.surface }]}
            onPress={() => null}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: modalTone.background },
              ]}
            >
              <Ionicons
                name="notifications"
                size={24}
                color={modalTone.accent}
              />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <Pressable
              onPress={onPrimary}
              accessibilityRole="button"
              style={[
                styles.primaryButton,
                { backgroundColor: modalTone.accent },
              ]}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </Pressable>

            {secondaryLabel && onSecondary ? (
              <Pressable
                onPress={onSecondary}
                accessibilityRole="button"
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default memo(ActionModal);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 25, 24, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  centered: {
    width: "100%",
    maxWidth: 420,
  },
  card: {
    borderRadius: ELDER_RADIUS.xl,
    padding: 20,
    ...ELDER_SHADOW,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    color: ELDER_COLORS.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  message: {
    color: ELDER_COLORS.textSoft,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 18,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: ELDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: ELDER_COLORS.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: ELDER_RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: ELDER_COLORS.border,
    backgroundColor: ELDER_COLORS.surfaceSoft,
  },
  secondaryText: {
    color: ELDER_COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "900",
  },
});
