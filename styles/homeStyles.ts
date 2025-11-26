import { StyleSheet } from 'react-native';

import { Palette } from '@/constants/Palette';

const {
  background: BACKGROUND,
  surface: SURFACE,
  surfaceSubtle: SURFACE_SUBTLE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  primary: PRIMARY,
} = Palette;

export const homeStyles = StyleSheet.create({
  appHero: {
    marginBottom: 24,
    paddingVertical: 0,
  },
  appHeroIcon: {
    width: 48,
    height: 48,
  },
  check: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyLink: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 8,
  },
  container: {
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  done: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  due: {
    fontSize: 11,
    textAlign: 'right',
    color: TEXT_MUTED,
  },
  empty: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  emptyButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  emptyButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyButtonStack: {
    marginTop: 24,
    flexDirection: 'column',
    gap: 14,
    alignItems: 'center',
  },
  emptyText: {
    color: TEXT_PRIMARY,
    fontWeight: '600'
  },
  listContent: {
    gap: 16,
    paddingBottom: 80,
  },
  listEmptyContent: { flexGrow: 1, justifyContent: 'center' },
  pageHeaderTitle: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND
  },
  scheduleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  scheduleLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600'
  },
  scheduleLink: {
    padding: 4
  },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleRow: {
    alignItems: 'center',
    borderColor: 'rgba(37, 99, 235, 0.28)',
    backgroundColor: 'rgba(37, 99, 235, 0.03)',
  },
  scheduleTitle: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '600'
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 32,
  },
  statusCard: {
    width: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    backgroundColor: SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    gap: 8,
    minHeight: 118,
  },
  statusCardCaption: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 14,
  },
  statusCardCaptionContainer: {
    height: 28,
    justifyContent: 'flex-start',
  },
  statusCardCount: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700'
  },
  statusCardCountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  statusCardCountUnit: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 18,
    paddingBottom: 2,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 34,
  },
  statusCardLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 13
  },
  statusCardLast: {
    marginRight: 0
  },
  statusCardTexts: {
    flex: 1
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  summaryBadgeLabel: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 12
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryScroll: {
    paddingRight: 8
  },
  summarySection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summarySubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 16
  },
  taskBody: {
    flex: 1,
  },
  taskBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tasksHeader: {
    marginTop: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  tasksSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  tasksTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  taskTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '500',
    fontSize: 13,
  },
  taskTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
