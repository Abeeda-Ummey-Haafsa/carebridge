import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { SpendingPoint } from "@/store/relativeSessionsStore";
import {
  RELATIVE_COLORS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
  RELATIVE_SHADOW,
} from "../theme";

interface RelativeSpendingWidgetProps {
  totalSpent: number;
  activeBookingCosts: number;
  completedPayments: number;
  averageSessionCost: number;
  weeklyTrend: SpendingPoint[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

export const RelativeSpendingWidget: React.FC<RelativeSpendingWidgetProps> = ({
  totalSpent,
  activeBookingCosts,
  completedPayments,
  averageSessionCost,
  weeklyTrend,
}) => {
  const barData = weeklyTrend.map((item, index) => ({
    value: item.value,
    label: item.label,
    frontColor: index % 2 === 0 ? RELATIVE_COLORS.teal : "#7acfbf",
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payment & Spending</Text>

      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Total This Month</Text>
          <Text style={styles.metricValue}>{formatCurrency(totalSpent)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Active Costs</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(activeBookingCosts)}
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Completed Payments</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(completedPayments)}
          </Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Average Session</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(averageSessionCost)}
          </Text>
        </View>
      </View>

      <View style={styles.chartWrap}>
        <Text style={styles.chartTitle}>Weekly Trend</Text>
        <BarChart
          data={barData}
          barWidth={18}
          spacing={16}
          roundedTop
          roundedBottom
          maxValue={Math.max(250, ...barData.map((item) => item.value))}
          xAxisThickness={0}
          yAxisThickness={0}
          noOfSections={3}
          yAxisTextStyle={{ color: RELATIVE_COLORS.muted, fontSize: 10 }}
          isAnimated
          animationDuration={900}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: RELATIVE_LAYOUT.screenPadding,
    marginTop: 12,
    borderRadius: RELATIVE_RADIUS.lg,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 14,
    ...RELATIVE_SHADOW,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  metricsGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  metricBox: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 3,
    color: RELATIVE_COLORS.teal,
    fontSize: 14,
    fontWeight: "800",
  },
  chartWrap: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#f9fdfc",
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  chartTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 2,
  },
});
