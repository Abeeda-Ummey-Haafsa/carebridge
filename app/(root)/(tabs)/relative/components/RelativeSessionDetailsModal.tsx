import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants";
import { RelativeCareSession } from "@/store/relativeSessionsStore";
import {
  RELATIVE_COLORS,
  RELATIVE_GRADIENTS,
  RELATIVE_LAYOUT,
  RELATIVE_RADIUS,
} from "../theme";

interface RelativeSessionDetailsModalProps {
  visible: boolean;
  session: RelativeCareSession | null;
  onClose: () => void;
  onRebook?: () => void;
  onLeaveReview?: () => void;
  onChat?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
  }).format(amount);
};

export const RelativeSessionDetailsModal: React.FC<
  RelativeSessionDetailsModalProps
> = ({ visible, session, onClose, onRebook, onLeaveReview, onChat }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    updates: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const statusColor = useMemo(() => {
    if (!session) return RELATIVE_COLORS.success;
    if (session.status === "Upcoming") return "#0284c7";
    if (session.status === "Active") return RELATIVE_COLORS.teal;
    if (session.status === "Cancelled") return RELATIVE_COLORS.danger;
    return RELATIVE_COLORS.success;
  }, [session]);

  if (!session) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <LinearGradient
            colors={RELATIVE_GRADIENTS.header}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Session Details</Text>
                <Text style={styles.headerSubtitle}>{session.date}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Image source={icons.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.peopleRow}>
              <View style={styles.peopleCard}>
                <Image
                  source={{ uri: session.caregiverAvatarUrl }}
                  style={styles.avatar}
                />
                <View style={styles.peopleTextWrap}>
                  <Text style={styles.peopleLabel}>Caregiver</Text>
                  <Text style={styles.peopleName}>{session.caregiverName}</Text>
                </View>
              </View>
              <View style={styles.peopleCard}>
                <Image
                  source={{ uri: session.elderAvatarUrl }}
                  style={styles.avatar}
                />
                <View style={styles.peopleTextWrap}>
                  <Text style={styles.peopleLabel}>Elder</Text>
                  <Text style={styles.peopleName}>{session.elderName}</Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.statusChip,
                { backgroundColor: "rgba(255,255,255,0.18)" },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={styles.statusText}>{session.status}</Text>
            </View>
          </LinearGradient>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Section
              title="Session Overview"
              open={!!openSections.overview}
              onToggle={() => toggleSection("overview")}
            >
              <View style={styles.grid}>
                <InfoCell label="Care Type" value={session.careType} />
                <InfoCell label="Duration" value={session.duration} />
                <InfoCell label="Start" value={session.startTime} />
                <InfoCell label="End" value={session.endTime} />
              </View>
            </Section>

            <Section
              title="Care Updates"
              open={!!openSections.updates}
              onToggle={() => toggleSection("updates")}
            >
              {!!session.sessionUpdates?.length ? (
                <View style={styles.listWrap}>
                  {session.sessionUpdates.map((update) => (
                    <View key={update.id} style={styles.updateRow}>
                      <View style={styles.updateDot} />
                      <View style={styles.updateBody}>
                        <Text style={styles.updateTime}>
                          {update.timestamp}
                        </Text>
                        <Text style={styles.updateMessage}>
                          {update.message}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.placeholderText}>
                  No live updates captured for this session.
                </Text>
              )}
            </Section>

            <Section
              title="Payment Summary"
              open={!!openSections.payment}
              onToggle={() => toggleSection("payment")}
            >
              <View style={styles.paymentWrap}>
                <PaymentRow
                  label="Session Cost"
                  value={formatCurrency(session.cost)}
                />
                <PaymentRow label="Service Duration" value={session.duration} />
                <PaymentRow
                  label="Total"
                  value={formatCurrency(session.cost)}
                  highlight
                />
              </View>
            </Section>

            <Section
              title="Caregiver Notes"
              open={!!openSections.notes}
              onToggle={() => toggleSection("notes")}
            >
              <Text style={styles.notes}>{session.notes}</Text>
            </Section>

            <Section
              title="Session Timeline"
              open={!!openSections.timeline}
              onToggle={() => toggleSection("timeline")}
            >
              <View style={styles.listWrap}>
                {!!session.checkInTime && (
                  <TimelineRow label="Check-In" value={session.checkInTime} />
                )}
                {!!session.checkOutTime && (
                  <TimelineRow label="Check-Out" value={session.checkOutTime} />
                )}
                {!session.checkInTime && !session.checkOutTime && (
                  <Text style={styles.placeholderText}>
                    Timeline details will appear after caregiver check-ins.
                  </Text>
                )}
              </View>
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onChat}>
              <Text style={styles.primaryBtnText}>Open Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={onRebook}>
              <Text style={styles.secondaryBtnText}>Rebook</Text>
            </TouchableOpacity>

            {session.status === "Completed" && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onLeaveReview}
              >
                <Text style={styles.secondaryBtnText}>Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Section: React.FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, open, onToggle, children }) => {
  return (
    <View style={styles.sectionWrap}>
      <TouchableOpacity style={styles.sectionHead} onPress={onToggle}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Image
          source={icons.arrowDown}
          style={[styles.arrow, open && styles.arrowOpen]}
        />
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
};

const InfoCell: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.infoCell}>
    <Text style={styles.cellLabel}>{label}</Text>
    <Text style={styles.cellValue}>{value}</Text>
  </View>
);

const PaymentRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <View style={styles.paymentRow}>
    <Text style={styles.paymentLabel}>{label}</Text>
    <Text style={[styles.paymentValue, highlight && styles.paymentValueStrong]}>
      {value}
    </Text>
  </View>
);

const TimelineRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.timelineRow}>
    <View style={styles.timelinePin} />
    <View style={styles.timelineTextWrap}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  sheet: {
    backgroundColor: RELATIVE_COLORS.screen,
    height: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#cddfdd",
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  closeIcon: {
    width: 16,
    height: 16,
    tintColor: "#fff",
  },
  peopleRow: {
    marginTop: 10,
    gap: 8,
  },
  peopleCard: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  peopleTextWrap: {
    marginLeft: 8,
  },
  peopleLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 10,
    fontWeight: "600",
  },
  peopleName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  statusChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingVertical: 12,
    paddingBottom: 26,
    gap: 8,
  },
  sectionWrap: {
    borderRadius: RELATIVE_RADIUS.md,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    overflow: "hidden",
  },
  sectionHead: {
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: RELATIVE_COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },
  arrow: {
    width: 14,
    height: 14,
    tintColor: RELATIVE_COLORS.muted,
  },
  arrowOpen: {
    transform: [{ rotate: "180deg" }],
  },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCell: {
    width: "48%",
    borderRadius: 10,
    backgroundColor: RELATIVE_COLORS.surface,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cellLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  cellValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  listWrap: {
    gap: 8,
  },
  updateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  updateDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginTop: 6,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  updateBody: {
    flex: 1,
  },
  updateTime: {
    color: RELATIVE_COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  updateMessage: {
    color: RELATIVE_COLORS.text,
    fontSize: 12,
    marginTop: 2,
  },
  paymentWrap: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  paymentValue: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  paymentValueStrong: {
    color: RELATIVE_COLORS.teal,
    fontSize: 15,
    fontWeight: "800",
  },
  notes: {
    color: RELATIVE_COLORS.text,
    fontSize: 13,
    lineHeight: 19,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timelinePin: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: RELATIVE_COLORS.teal,
  },
  timelineTextWrap: {
    flex: 1,
  },
  placeholderText: {
    color: RELATIVE_COLORS.muted,
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: RELATIVE_COLORS.border,
    paddingHorizontal: RELATIVE_LAYOUT.screenPadding,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fff",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: RELATIVE_COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RELATIVE_COLORS.border,
    backgroundColor: RELATIVE_COLORS.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  secondaryBtnText: {
    color: RELATIVE_COLORS.teal,
    fontSize: 12,
    fontWeight: "700",
  },
});
