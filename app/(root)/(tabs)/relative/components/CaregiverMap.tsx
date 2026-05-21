import React, { forwardRef, memo, useEffect, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, Marker, Polyline, Region } from "react-native-maps";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";
import { FindCareCaregiver, FindCareCoordinates } from "@/types/find-care";

interface CaregiverMapProps {
  caregivers: FindCareCaregiver[];
  selectedCaregiverId: string | null;
  elderLocation: FindCareCoordinates;
  currentRegion: Region;
  onSelectCaregiver: (caregiverId: string) => void;
  onMapReady?: () => void;
}

const CaregiverMap = forwardRef<MapView, CaregiverMapProps>(
  function CaregiverMap(
    {
      caregivers,
      selectedCaregiverId,
      elderLocation,
      currentRegion,
      onSelectCaregiver,
      onMapReady,
    },
    ref,
  ) {
    const pulse = useSharedValue(0.65);

    useEffect(() => {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900 }),
          withTiming(0.65, { duration: 900 }),
        ),
        -1,
        false,
      );
    }, [pulse]);

    const selectedCaregiver = useMemo(
      () =>
        caregivers.find((caregiver) => caregiver.id === selectedCaregiverId),
      [caregivers, selectedCaregiverId],
    );

    const routeCoordinates = useMemo(() => {
      if (!selectedCaregiver) {
        return [];
      }

      return [elderLocation, selectedCaregiver.coordinate];
    }, [elderLocation, selectedCaregiver]);

    const clusterStyle = useAnimatedStyle(() => ({
      transform: [{ scale: interpolate(pulse.value, [0.65, 1], [0.96, 1.08]) }],
      opacity: interpolate(pulse.value, [0.65, 1], [0.7, 1]),
    }));

    if (Platform.OS === "web") {
      return (
        <View style={styles.webShell}>
          <View style={styles.webGradientOne} />
          <View style={styles.webGradientTwo} />
          <View style={styles.webCard}>
            <Text style={styles.webTitle}>Nearby caregivers</Text>
            <Text style={styles.webSubtitle}>
              Interactive map preview is optimized for mobile, so this view
              keeps the same search and selection rhythm on web.
            </Text>
          </View>
          <View style={styles.webPinCluster}>
            {caregivers.slice(0, 4).map((caregiver, index) => (
              <View
                key={caregiver.id}
                style={[
                  styles.webPin,
                  { top: 80 + index * 62, left: 40 + index * 52 },
                ]}
              >
                <Ionicons
                  name="medkit-outline"
                  size={18}
                  color={RELATIVE_COLORS.deepTeal}
                />
                <Text style={styles.webPinLabel}>
                  {caregiver.name.split(" ")[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.shell}>
        <MapView
          ref={ref}
          style={StyleSheet.absoluteFill}
          initialRegion={currentRegion}
          onMapReady={onMapReady}
          showsUserLocation={false}
          showsMyLocationButton={false}
          mapPadding={{ top: 120, right: 24, bottom: 240, left: 24 }}
        >
          <Circle
            center={elderLocation}
            radius={650}
            fillColor="rgba(31,178,153,0.08)"
            strokeColor="rgba(31,178,153,0.26)"
            strokeWidth={2}
          />

          <Marker coordinate={elderLocation} tracksViewChanges={false}>
            <View style={styles.elderMarker}>
              <View style={styles.elderMarkerInner}>
                <Ionicons name="home" size={16} color="#fff" />
              </View>
            </View>
          </Marker>

          {caregivers.map((caregiver) => {
            const isSelected = caregiver.id === selectedCaregiverId;
            const isAvailable = caregiver.availability === "available-now";
            return (
              <Marker
                key={caregiver.id}
                coordinate={caregiver.coordinate}
                onPress={() => onSelectCaregiver(caregiver.id)}
                tracksViewChanges={false}
              >
                <Animated.View
                  style={[
                    styles.markerWrap,
                    isSelected && styles.markerWrapSelected,
                    !isAvailable && styles.markerWrapMuted,
                  ]}
                >
                  {isSelected ? (
                    <View style={styles.markerSelectedInner}>
                      <Text style={styles.markerSelectedText}>
                        {caregiver.avatarLabel}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.markerInner}>
                      <Text style={styles.markerText}>
                        {caregiver.avatarLabel}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[styles.pulse, isSelected && styles.pulseSelected]}
                  />
                </Animated.View>
              </Marker>
            );
          })}

          {routeCoordinates.length > 1 ? (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={RELATIVE_COLORS.teal}
              strokeWidth={4}
              lineDashPattern={[12, 10]}
            />
          ) : null}
        </MapView>

        <Animated.View style={[styles.clusterBubble, clusterStyle]}>
          <Ionicons
            name="layers-outline"
            size={14}
            color={RELATIVE_COLORS.deepTeal}
          />
          <Text style={styles.clusterText}>
            {caregivers.length} caregivers nearby
          </Text>
        </Animated.View>

        {selectedCaregiver ? (
          <View style={styles.routePill}>
            <Ionicons
              name="time-outline"
              size={14}
              color={RELATIVE_COLORS.tealDark}
            />
            <Text style={styles.routePillText}>
              {selectedCaregiver.routeLabel} route preview
            </Text>
          </View>
        ) : null}
      </View>
    );
  },
);

export default memo(CaregiverMap);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    borderRadius: RELATIVE_RADIUS.xl,
    overflow: "hidden",
    backgroundColor: "#dff3f1",
  },
  elderMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13,92,99,0.18)",
  },
  elderMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.deepTeal,
    ...RELATIVE_SHADOW,
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerWrapSelected: {
    transform: [{ scale: 1.1 }],
  },
  markerWrapMuted: {
    opacity: 0.68,
  },
  markerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 2,
    borderColor: RELATIVE_COLORS.teal,
    ...RELATIVE_SHADOW,
  },
  markerSelectedInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: RELATIVE_COLORS.teal,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.95)",
    ...RELATIVE_SHADOW,
  },
  markerText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 11,
    fontWeight: "800",
  },
  markerSelectedText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  pulse: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(31,178,153,0.16)",
    zIndex: -1,
  },
  pulseSelected: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(31,178,153,0.2)",
  },
  clusterBubble: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.88)",
    ...RELATIVE_SHADOW,
  },
  clusterText: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 12,
    fontWeight: "700",
  },
  routePill: {
    position: "absolute",
    left: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...RELATIVE_SHADOW,
  },
  routePillText: {
    color: RELATIVE_COLORS.tealDark,
    fontSize: 12,
    fontWeight: "700",
  },
  webShell: {
    flex: 1,
    backgroundColor: "#dff3f1",
    borderRadius: RELATIVE_RADIUS.xl,
    overflow: "hidden",
  },
  webGradientOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(31,178,153,0.18)",
    top: -50,
    right: -30,
  },
  webGradientTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(13,92,99,0.12)",
    bottom: -40,
    left: -30,
  },
  webCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 16,
    padding: 16,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
    ...RELATIVE_SHADOW,
  },
  webTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  webSubtitle: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  webPinCluster: {
    flex: 1,
    paddingTop: 112,
  },
  webPin: {
    position: "absolute",
    width: 86,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    ...RELATIVE_SHADOW,
  },
  webPinLabel: {
    color: RELATIVE_COLORS.deepTeal,
    fontSize: 11,
    fontWeight: "800",
  },
});
