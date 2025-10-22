import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCallback, useEffect, useMemo, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
  format(parseISO(iso), 'yyyy年M月d日 (EEE) HH:mm', { locale: ja });
const formatDisplayDay = (iso: string) =>
  format(parseISO(iso), 'M月d日 (EEE)', { locale: ja });
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
const COLUMN_WIDTH = '14.2857%';
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

  useEffect(() => {
    if (dayKeys.length === 0) {
      setSelectedDate(todayKey);
      setFocusedMonth(startOfMonth(new Date()));
      return;
    }

    if (!eventsByDay[selectedDate]) {
      const nextSelected = dayKeys[0];
      setSelectedDate(nextSelected);
      setFocusedMonth(startOfMonth(parseISO(nextSelected)));
    }
  }, [dayKeys, eventsByDay, selectedDate, todayKey]);

  useEffect(() => {
    setFocusedMonth(startOfMonth(parseISO(selectedDate)));
  }, [selectedDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(focusedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [focusedMonth]);

  const handleSelectDay = useCallback(
    (key: string, hasEvents: boolean) => {
      setSelectedDate(key);
      if (hasEvents) {
        setActiveDayKey(key);
      }
    },
    []
  );

  const activeDayEvents = activeDayKey ? eventsByDay[activeDayKey] ?? [] : [];
  const heroMonthLabel = format(focusedMonth, 'yyyy年 M月', { locale: ja });
  const nextUpcoming = useMemo(() => {
    const upcoming = dayKeys
      .flatMap((key) => (eventsByDay[key] ?? []))
      .filter((event) => isAfter(new Date(event.dateTime), new Date()))
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    return upcoming[0];
  }, [dayKeys, eventsByDay]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View>
              <ThemedText type="title" style={styles.heroTitle}>
                {heroMonthLabel}
              </ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                {nextUpcoming
                  ? `${nextUpcoming.companyName}の予定まであと少しです。`
                  : '今月の予定を登録して、計画を可視化しましょう。'}
              </ThemedText>
            </View>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.heroButton}
                onPress={() => setFocusedMonth((prev) => addMonths(prev, -1))}
              >
                <MaterialIcons name="chevron-left" size={20} color={PRIMARY} />
              </Pressable>
              <Pressable
                style={styles.heroButton}
                onPress={() => setFocusedMonth((prev) => addMonths(prev, 1))}
              >
                <MaterialIcons name="chevron-right" size={20} color={PRIMARY} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <ThemedText key={day} style={styles.weekDay}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const key = toDateKey(day);
              const dayEvents = eventsByDay[key] ?? [];
              const isCurrentMonth = isSameMonth(day, focusedMonth);
              const isSelected = key === selectedDate;
              const today = isToday(day);

              const inlineEvents = dayEvents.slice(0, MAX_INLINE_EVENTS);
              const remainingCount = Math.max(dayEvents.length - inlineEvents.length, 0);

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.outsideCell,
                    isSelected && styles.selectedCell,
                    today && styles.todayOutline,
                  ]}
                  onPress={() => handleSelectDay(key, dayEvents.length > 0)}
                >
                  <View style={styles.dayHeader}>
                    <ThemedText style={styles.dayNumber}>{format(day, 'd')}</ThemedText>
                    {today && <View style={styles.todayDot} />}
                  </View>
                  <View style={styles.dayEvents}>
                    {inlineEvents.map((event) => (
                      <View
                        key={`${event.companyId}-${event.dateTime}-${event.type}`}
                        style={[
                          styles.eventChip,
                          event.type === 'confirmed' ? styles.confirmedChip : styles.candidateChip,
                        ]}
                      >
                        <MaterialIcons
                          name={event.type === 'confirmed' ? 'check-circle' : 'hourglass-bottom'}
                          size={12}
                          color={event.type === 'confirmed' ? SUCCESS : WARNING}
                        />
                        <ThemedText
                          style={[
                            styles.eventChipText,
                            event.type === 'confirmed'
                              ? styles.confirmedChipText
                              : styles.candidateChipText,
                          ]}
                        >
                          {formatTimeLabel(event.dateTime)}
                        </ThemedText>
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
        </ScrollView>
      </ThemedView>

      <Modal visible={Boolean(activeDayKey)} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setActiveDayKey(null)}>
          <Pressable style={styles.modalShell} onPress={(event) => event.stopPropagation()}>
            <ThemedView style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                候補日・確定日
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
                <ThemedText style={styles.modalLabel}>種別</ThemedText>
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
    padding: 20,
    paddingBottom: 120,
    gap: 20,
  },
  heroCard: {
    backgroundColor: SURFACE,
    padding: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    shadowColor: '#CBD5F5',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    gap: 12,
  },
  heroTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: TEXT_MUTED,
    marginTop: 4,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    color: TEXT_MUTED,
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayCell: {
    width: COLUMN_WIDTH,
    minHeight: 110,
    borderRadius: 16,
    padding: 10,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    gap: 6,
  },
  selectedCell: {
    backgroundColor: '#E8F1FF',
    borderColor: PRIMARY,
    shadowColor: '#93C5FD',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  todayOutline: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  outsideCell: {
    opacity: 0.35,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayNumber: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  dayEvents: {
    gap: 6,
  },
  eventChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  confirmedChip: {
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
  },
  candidateChip: {
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
  },
  eventChipText: {
    fontWeight: '600',
    fontSize: 12,
  },
  confirmedChipText: {
    color: SUCCESS,
  },
  candidateChipText: {
    color: WARNING,
  },
  moreChip: {
    alignSelf: 'flex-start',
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moreChipText: {
    color: TEXT_MUTED,
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    padding: 24,
  },
  modalShell: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 16,
    maxHeight: '85%',
  },
  modalTitle: {
    color: TEXT_PRIMARY,
  },
  modalCaption: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  dayModalList: {
    gap: 12,
  },
  dayModalItem: {
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayModalMeta: {
    gap: 6,
  },
  dayModalTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayModalTimeText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  dayModalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDayMessage: {
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingVertical: 32,
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
  primaryButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: PRIMARY,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusTagLabel: {
    fontWeight: '600',
  },
});
