import React, { memo } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

import { RelativeCareOption } from "@/types/relative-dashboard";

import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface BookingCTAProps {
  nearbyCaregivers: number;
  careOptions: RelativeCareOption[];
  onBookCareNow: () => void;
}

function BookingCTA({
  nearbyCaregivers,
  careOptions,
  onBookCareNow,
}: BookingCTAProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(160).duration(420)}
      style={styles.shell}
    >
      <LinearGradient colors={RELATIVE_GRADIENTS.booking} style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.headingBlock}>
            <Text style={styles.kicker}>Fast booking</Text>
            <Text style={styles.title}>Book Care Now</Text>
            <Text style={styles.subtitle}>
              {nearbyCaregivers} nearby caregivers are available for immediate
              or scheduled support.
            </Text>
          </View>

          <View style={styles.countBubble}>
            <Image source={icons.findCare} style={styles.countIcon} />
            <Text style={styles.countValue}>{nearbyCaregivers}</Text>
            <Text style={styles.countLabel}>nearby</Text>
          </View>
        </View>

        <FlatList
          data={careOptions}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipRail}
          renderItem={({ item }) => (
            <View style={styles.chip}>
              <Text style={styles.chipTitle}>{item.title}</Text>
              <Text style={styles.chipSubtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        <Pressable
          onPress={onBookCareNow}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <View style={styles.ctaButtonInner}>
            <Text style={styles.ctaButtonText}>Start booking</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

export default memo(BookingCTA);

const styles = StyleSheet.create({
  shell: {
    marginBottom: 18,
    borderRadius: RELATIVE_RADIUS.xl,
    overflow: "hidden",
    ...RELATIVE_SHADOW,
  },
  card: {
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  headingBlock: {
    flex: 1,
    paddingRight: 4,
  },
  kicker: {
    color: "#dff9f4",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    marginBottom: 4,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: "#ecfffc",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  countBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  countIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
    marginBottom: 2,
  },
  countValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  countLabel: {
    color: "#dcf7f3",
    fontSize: 10,
    fontWeight: "700",
  },
  chipRail: {
    gap: 10,
    paddingBottom: 14,
  },
  chip: {
    width: 172,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: RELATIVE_RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  chipTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  chipSubtitle: {
    color: "#e9fbf8",
    fontSize: 11,
    lineHeight: 15,
  },
  ctaButton: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.96,
  },
  ctaButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  ctaButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
