import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND = '#F2F6FF';
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F8FAFF';
const BORDER = '#D8E3FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#16A34A';
const WARNING = '#F97316';

const formatDateKey = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'yyyy年M月d日（EEE）HH:mm', { locale: ja });
const formatDisplayDay = (iso: string) =>
  format(parseISO(iso), 'M月d日（EEE）', { locale: ja });
const formatTimeLabel = (iso: string) => format(parseISO(iso), 'HH:mm', { locale: ja });

interface CalendarEvent {
  companyId: string;
  companyName: string;
  progressStatus: string;
  remarks?: string;
  type: 'candidate' | 'confirmed';
  dateTime: string;
}

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
const MAX_INLINE_EVENTS = 3;

export default function CalendarScreen() {
  const companies = useAppStore((state) => state.companies);

  const { eventsByDay, dayKeys } = useMemo(() => {
    const events: CalendarEvent[] = [];

    companies.forEach((company) => {
      company.candidateDates.forEach((date) => {
        events.push({
          companyId: company.id,
          companyName: company.name,
          progressStatus: company.progressStatus,
          remarks: company.remarks,
          type: 'candidate',
          dateTime: date,
        });
      });

      if (company.confirmedDate) {
        events.push({
          companyId: company.id,
          companyName: company.name,
          progressStatus: company.progressStatus,
          remarks: company.remarks,
          type: 'confirmed',
          dateTime: company.confirmedDate,
        });
      }
    });

    const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const key = formatDateKey(event.dateTime);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    const keys = Object.keys(grouped).sort();
    return { eventsByDay: grouped, dayKeys: keys };
  }, [companies]);

  const todayKey = toDateKey(new Date());
  const initialSelected = dayKeys.find((key) => key >= todayKey) ?? todayKey;

  const [selectedDate, setSelectedDate] = useState(initialSelected);
  const [focusedMonth, setFocusedMonth] = useState(startOfMonth(parseISO(initialSelected)));
  const [activeDayKey, setActiveDayKey] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const previousDayKeyCount = useRef(dayKeys.length);

  useEffect(() => {
    if (dayKeys.length === 0) {
      setSelectedDate(todayKey);
      setFocusedMonth(startOfMonth(new Date()));
    } else if (previousDayKeyCount.current === 0 && dayKeys.length > 0) {
      const nextSelected = dayKeys.find((key) => key >= todayKey) ?? dayKeys[0];
      setSelectedDate(nextSelected);
      setFocusedMonth(startOfMonth(parseISO(nextSelected)));
    }
    previousDayKeyCount.current = dayKeys.length;
  }, [dayKeys, todayKey]);

  useEffect(() => {
    setFocusedMonth(startOfMonth(parseISO(selectedDate)));
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(focusedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [focusedMonth]);
  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    for (let index = 0; index < calendarDays.length; index += 7) {
      weeks.push(calendarDays.slice(index, index + 7));
    }
    return weeks;
  }, [calendarDays]);

  const handleSelectDay = useCallback(
    (key: string, hasEvents: boolean) => {
      setSelectedDate(key);
      if (hasEvents) {
        setActiveDayKey(key);
      } else {
        setActiveDayKey(null);
        setActiveEvent(null);
      }
    },
    []
  );

  const activeDayEvents = activeDayKey ? eventsByDay[activeDayKey] ?? [] : [];
  const currentMonthLabel = format(focusedMonth, 'yyyy年M月', { locale: ja });
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.monthSwitcher}>
            <Pressable
              style={styles.monthButton}
              onPress={() => setFocusedMonth((prev) => addMonths(prev, -1))}
            >
              <MaterialIcons name="chevron-left" size={22} color={PRIMARY} />
            </Pressable>
            <ThemedText type="title" style={styles.monthLabel}>
              {currentMonthLabel}
            </ThemedText>
            <Pressable
              style={styles.monthButton}
              onPress={() => setFocusedMonth((prev) => addMonths(prev, 1))}
            >
              <MaterialIcons name="chevron-right" size={22} color={PRIMARY} />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <ThemedText key={day} style={styles.weekDay}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarWeeks.map((week, weekIndex) => (
              <View
                key={`${week[0].toISOString()}-${weekIndex}`}
                style={[
                  styles.weekRow,
                  weekIndex === calendarWeeks.length - 1 && styles.lastWeekRow,
                ]}
              >
                {week.map((day, dayIndex) => {
                  const key = toDateKey(day);
                  const dayEvents = eventsByDay[key] ?? [];
                  const isCurrentMonth = isSameMonth(day, focusedMonth);
                  const isSelected = key === selectedDate;
                  const today = isToday(day);
                  const isLastColumn = dayIndex === week.length - 1;

                  const inlineEvents = dayEvents.slice(0, MAX_INLINE_EVENTS);
                  const remainingCount = Math.max(dayEvents.length - inlineEvents.length, 0);

                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.dayCell,
                        isLastColumn && styles.lastColumnCell,
                        !isCurrentMonth && styles.outsideCell,
                        isSelected && styles.selectedCell,
                        today && styles.todayOutline,
                      ]}
                      onPress={() => handleSelectDay(key, dayEvents.length > 0)}
                    >
                      <View style={styles.dayHeader}>
                        <ThemedText
                          style={[styles.dayNumber, !isCurrentMonth && styles.outsideDayNumber]}
                        >
                          {format(day, 'd')}
                        </ThemedText>
                        {today && <View style={styles.todayDot} />}
                      </View>
                      <View style={styles.dayEvents}>
                        {inlineEvents.map((event) => (
                          <View
                            key={`${event.companyId}-${event.dateTime}-${event.type}`}
                            style={[
                              styles.eventChip,
                              event.type === 'confirmed'
                                ? styles.confirmedChip
                                : styles.candidateChip,
                            ]}
                          >
                            <View
                              style={[
                                styles.eventIndicator,
                                event.type === 'confirmed'
                                  ? styles.confirmedIndicator
                                  : styles.candidateIndicator,
                              ]}
                            />
                            <View style={styles.eventChipBody}>
                              <ThemedText
                                style={[
                                  styles.eventTime,
                                  event.type === 'confirmed'
                                    ? styles.confirmedChipText
                                    : styles.candidateChipText,
                                ]}
                              >
                                {formatTimeLabel(event.dateTime)}
                              </ThemedText>
                              <ThemedText
                                style={[
                                  styles.eventChipText,
                                  event.type === 'confirmed'
                                    ? styles.confirmedChipText
                                    : styles.candidateChipText,
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {event.companyName}
                              </ThemedText>
                            </View>
                          </View>
                        ))}
                        {remainingCount > 0 && (
                          <View style={styles.moreChip}>
                            <ThemedText style={styles.moreChipText}>+{remainingCount}</ThemedText>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ThemedView>

      <Modal visible={Boolean(activeDayKey)} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setActiveDayKey(null)}>
          <Pressable style={styles.modalShell} onPress={(event) => event.stopPropagation()}>
            <ThemedView style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                この日の予定
              </ThemedText>
              <ThemedText style={styles.modalCaption}>
                {activeDayKey ? formatDisplayDay(`${activeDayKey}T00:00:00`) : ''}
              </ThemedText>
              <ScrollView contentContainerStyle={styles.dayModalList}>
                {activeDayEvents.length === 0 ? (
                  <ThemedText style={styles.emptyDayMessage}>
                    この日の予定は登録されていません。
                  </ThemedText>
                ) : (
                  activeDayEvents.map((event) => (
                    <Pressable
                      key={`${event.companyId}-${event.dateTime}-${event.type}`}
                      style={styles.dayModalItem}
                      onPress={() => setActiveEvent(event)}
                    >
                      <View style={styles.dayModalMeta}>
                        <View style={styles.dayModalTime}>
                          <MaterialIcons
                            name={event.type === 'confirmed' ? 'event-available' : 'event-note'}
                            size={16}
                            color={event.type === 'confirmed' ? SUCCESS : WARNING}
                          />
                          <ThemedText style={styles.dayModalTimeText}>
                            {formatTimeLabel(event.dateTime)}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.dayModalTitle}>{event.companyName}</ThemedText>
                      </View>
                      <StatusTag type={event.type} />
                    </Pressable>
                  ))
                )}
              </ScrollView>
              <Pressable style={styles.primaryButton} onPress={() => setActiveDayKey(null)}>
                <ThemedText style={styles.primaryButtonLabel}>閉じる</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={Boolean(activeEvent)} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setActiveEvent(null)}>
          <Pressable style={styles.modalShell} onPress={(event) => event.stopPropagation()}>
            <ThemedView style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                {activeEvent?.companyName ?? ''}
              </ThemedText>
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>日時</ThemedText>
                <ThemedText style={styles.modalValue}>
                  {activeEvent ? formatDisplayDate(activeEvent.dateTime) : ''}
                </ThemedText>
              </View>
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>区分</ThemedText>
                <StatusTag type={activeEvent?.type ?? 'candidate'} />
              </View>
              {activeEvent?.progressStatus ? (
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>進捗ステータス</ThemedText>
                  <ThemedText style={styles.modalValue}>{activeEvent.progressStatus}</ThemedText>
                </View>
              ) : null}
              {activeEvent?.remarks ? (
                <View style={styles.modalSection}>
                  <ThemedText style={styles.modalLabel}>メモ</ThemedText>
                  <ThemedText style={styles.modalValue}>{activeEvent.remarks}</ThemedText>
                </View>
              ) : null}
              <Pressable style={styles.primaryButton} onPress={() => setActiveEvent(null)}>
                <ThemedText style={styles.primaryButtonLabel}>閉じる</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StatusTag({ type }: { type: 'candidate' | 'confirmed' }) {
  const isConfirmed = type === 'confirmed';
  return (
    <View style={[styles.statusTag, { backgroundColor: isConfirmed ? '#DCFCE7' : '#FEF3C7' }]}>
      <MaterialIcons
        name={isConfirmed ? 'check-circle' : 'hourglass-bottom'}
        size={14}
        color={isConfirmed ? SUCCESS : WARNING}
      />
      <ThemedText style={[styles.statusTagLabel, { color: isConfirmed ? SUCCESS : WARNING }]}>
        {isConfirmed ? '確定' : '候補'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  monthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
  },
  monthLabel: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  calendarGrid: {
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  weekRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(100, 116, 139, 0.18)',
  },
  lastWeekRow: {
    borderBottomWidth: 0,
  },
  dayCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minHeight: 110,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(100, 116, 139, 0.12)',
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
  },
  todayOutline: {
    shadowColor: '#2563EB33',
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNumber: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: '100%',
  },
  eventIndicator: {
    width: 4,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  eventChipBody: {
    flex: 1,
    gap: 2,
  },
  eventTime: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  eventChipText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  confirmedChip: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  confirmedChipText: {
    color: SUCCESS,
  },
  confirmedIndicator: {
    backgroundColor: SUCCESS,
  },
  candidateChip: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
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
    alignSelf: 'flex-start',
  },
  moreChipText: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalShell: {
    width: '100%',
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
    textAlign: 'center',
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  modalCaption: {
    textAlign: 'center',
    color: TEXT_MUTED,
  },
  dayModalList: {
    gap: 12,
  },
  emptyDayMessage: {
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  dayModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  dayModalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayModalTimeText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  dayModalTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 16,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
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
    fontWeight: '600',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusTagLabel: {
    fontWeight: '600',
  },
});
