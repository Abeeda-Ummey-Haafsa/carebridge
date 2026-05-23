import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { PaymentMethod } from "@/store/relativeProfileStore";
import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface RelativePaymentMethodCardProps {
  payment: PaymentMethod;
  onManage?: () => void;
}

export const RelativePaymentMethodCard: React.FC<
  RelativePaymentMethodCardProps
> = ({ payment, onManage }) => {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <Text style={styles.brand}>{payment.brand}</Text>
        {payment.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      <Text style={styles.number}>**** **** **** {payment.last4}</Text>
      <Text style={styles.expiry}>Expires {payment.expiry}</Text>

      <TouchableOpacity style={styles.manageBtn} onPress={onManage}>
        <Text style={styles.manageText}>Manage Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    padding: 12,
    marginBottom: 8,
    ...RELATIVE_SHADOW,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: RELATIVE_COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  defaultBadge: {
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.surfaceTint,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 10,
    fontWeight: "800",
  },
  number: {
    marginTop: 8,
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  expiry: {
    marginTop: 4,
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  manageBtn: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  manageText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
