import React from "react";
import { View, StyleSheet } from "react-native";

import { RELATIVE_COLORS, RELATIVE_LAYOUT, RELATIVE_RADIUS } from "../theme";

const Block = ({ height }: { height: number }) => (
  <View style={[styles.block, { height }]} />
);

export const RelativeProfileLoading: React.FC = () => {
  return (
    <View style={styles.container}>
      <Block height={220} />
      <Block height={140} />
      <Block height={130} />
      <Block height={260} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 12,
    gap: 10,
  },
  block: {
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
  },
});
