import { StyleSheet } from "react-native";

import { Palette } from "@/constants/Palette";

const {
  backgroundAlt: BACKGROUND,
  surface: SURFACE,
  surfaceSubtle: SURFACE_SUBTLE,
  borderAlt: BORDER,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  primary: PRIMARY,
  successStrong: SUCCESS,
  warning: WARNING,
} = Palette;

export const calendarStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
  },
  monthLabel: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: "700",
  },
  weekHeader: {
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: TEXT_MUTED,
    fontWeight: "600",
  },
  calendarGrid: {
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  weekRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(100, 116, 139, 0.18)",
  },
  lastWeekRow: {
    borderBottomWidth: 0,
  },
  dayCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    minHeight: 80,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(100, 116, 139, 0.12)",
    backgroundColor: SURFACE,
  },
  lastColumnCell: {
    borderRightWidth: 0,
  },
  outsideCell: {
    backgroundColor: SURFACE_SUBTLE,
  },
  selectedCell: {
    borderColor: PRIMARY,
    borderWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  todayOutline: {
    shadowColor: "#2563EB33",
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayNumber: {
    color: TEXT_PRIMARY,
    fontWeight: "700",
  },
  outsideDayNumber: {
    color: TEXT_MUTED,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  dayEvents: {
    marginTop: 6,
    gap: 4,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  eventIndicator: {
    width: 3,
    borderRadius: 999,
    alignSelf: "stretch",
  },
  eventChipText: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  confirmedChip: {
    backgroundColor: "rgba(22, 163, 74, 0.12)",
  },
  confirmedChipText: {
    color: SUCCESS,
  },
  confirmedIndicator: {
    backgroundColor: SUCCESS,
  },
  candidateChip: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  candidateChipText: {
    color: WARNING,
  },
  candidateIndicator: {
    backgroundColor: WARNING,
  },
  moreChip: {
    borderRadius: 999,
    backgroundColor: SURFACE_SUBTLE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  moreChipText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  daySummaryRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryDotConfirmed: {
    backgroundColor: SUCCESS,
  },
  summaryDotCandidate: {
    backgroundColor: WARNING,
  },
  daySummaryText: {
    flex: 1,
    fontSize: 10,
    color: TEXT_PRIMARY,
  },
  daySummaryMore: {
    fontSize: 10,
    color: TEXT_MUTED,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalShell: {
    width: "100%",
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 18,
  },
  modalTitle: {
    textAlign: "center",
    color: TEXT_PRIMARY,
    fontWeight: "700",
  },
  modalSubtitle: {
    textAlign: "center",
    color: TEXT_MUTED,
  },
  modalCaption: {
    textAlign: "center",
    color: TEXT_MUTED,
  },
  dayModalList: {
    gap: 12,
  },
  emptyDayMessage: {
    color: TEXT_MUTED,
    textAlign: "center",
  },
  dayModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  dayModalMeta: {
    flex: 1,
    gap: 8,
  },
  dayModalInfo: {
    flex: 1,
    gap: 2,
  },
  dayModalTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayModalTimeText: {
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  dayModalTitle: {
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  dayModalCompany: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  modalSection: {
    gap: 6,
  },
  modalLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  modalValue: {
    color: TEXT_PRIMARY,
    fontWeight: "600",
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusTagLabel: {
    fontWeight: "600",
  },
});
