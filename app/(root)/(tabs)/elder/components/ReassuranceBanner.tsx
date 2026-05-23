import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ElderAlertTone } from "@/types/elder-dashboard";

import { ELDER_COLORS, ELDER_RADIUS, ELDER_SHADOW } from "../theme";

interface ReassuranceBannerProps {
  message: string;
  tone: ElderAlertTone;
  reduceMotion: boolean;
}

const TONE_COLORS: Record<
  ElderAlertTone,
  { background: string; accent: string }
> = {
  calm: { background: "#eef9f5", accent: ELDER_COLORS.primaryDark },
  reassuring: { background: "#edf8fb", accent: "#14516a" },
  success: { background: "#e7f7ee", accent: ELDER_COLORS.success },
  danger: { background: ELDER_COLORS.dangerSoft, accent: ELDER_COLORS.danger },
};

function ReassuranceBanner({
  message,
  tone,
  reduceMotion,
}: ReassuranceBannerProps) {
  const colors = TONE_COLORS[tone];

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(260)}
      exiting={reduceMotion ? undefined : FadeOut.duration(180)}
      style={[styles.card, { backgroundColor: colors.background }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={message}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent }]}>
          <Ionicons name="heart" size={18} color={ELDER_COLORS.surface} />
        </View>
        <Text style={[styles.text, { color: ELDER_COLORS.text }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

export default memo(ReassuranceBanner);

const styles = StyleSheet.create({
  card: {
    borderRadius: ELDER_RADIUS.xl,
    padding: 16,
    marginBottom: 16,
    ...ELDER_SHADOW,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
});
