import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import { RELATIVE_COLORS, RELATIVE_RADIUS, RELATIVE_SHADOW } from "../theme";

interface RelativeAnalyticsWidgetProps {
  activeSessions: number;
  completedBookings: number;
  monthlySpend: number;
  averageCaregiverRating: number;
  monthlySpendTrend: Array<{ label: string; value: number }>;
  bookingTrend: Array<{ label: string; value: number }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

export const RelativeAnalyticsWidget: React.FC<
  RelativeAnalyticsWidgetProps
> = ({
  activeSessions,
  completedBookings,
  monthlySpend,
  averageCaregiverRating,
  monthlySpendTrend,
  bookingTrend,
}) => {
  const spendData = monthlySpendTrend.map((item, index) => ({
    ...item,
    frontColor: index % 2 === 0 ? RELATIVE_COLORS.teal : "#8ccfc2",
  }));

  const bookingData = bookingTrend.map((item, index) => ({
    ...item,
    frontColor: index % 2 === 0 ? "#99bbef" : "#8ccfc2",
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Activity & Booking Summary</Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Active Sessions</Text>
          <Text style={styles.summaryValue}>{activeSessions}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Completed</Text>
          <Text style={styles.summaryValue}>{completedBookings}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Monthly Spend</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(monthlySpend)}
          </Text>
        </View>
        <View style={styles.summaryCell}>
          <Text style={styles.summaryLabel}>Avg Rating</Text>
          <Text style={styles.summaryValue}>
            {averageCaregiverRating.toFixed(1)}★
          </Text>
        </View>
      </View>

      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
        <BarChart
          data={spendData}
          barWidth={18}
          spacing={14}
          roundedTop
          roundedBottom
          xAxisThickness={0}
          yAxisThickness={0}
          noOfSections={3}
          yAxisTextStyle={{ color: RELATIVE_COLORS.muted, fontSize: 10 }}
          maxValue={Math.max(1800, ...spendData.map((item) => item.value))}
          isAnimated
          animationDuration={800}
        />
      </View>

      <View style={styles.chartBlock}>
        <Text style={styles.chartTitle}>Booking Frequency</Text>
        <BarChart
          data={bookingData}
          barWidth={18}
          spacing={18}
          roundedTop
          roundedBottom
          xAxisThickness={0}
          yAxisThickness={0}
          noOfSections={3}
          yAxisTextStyle={{ color: RELATIVE_COLORS.muted, fontSize: 10 }}
          maxValue={Math.max(10, ...bookingData.map((item) => item.value))}
          isAnimated
          animationDuration={900}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RELATIVE_RADIUS.md,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surface,
    padding: 12,
    ...RELATIVE_SHADOW,
  },
  title: {
    color: RELATIVE_COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  summaryGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCell: {
    width: "48%",
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },
  summaryValue: {
    marginTop: 3,
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  chartBlock: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: "#fbfefd",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  chartTitle: {
    marginBottom: 8,
    marginLeft: 6,
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
