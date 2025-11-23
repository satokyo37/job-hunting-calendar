import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
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
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { ProgressStatusValue } from '@/constants/progressStatus';
import { useAppStore } from '@/store/useAppStore';
import { calendarStyles as styles } from '@/styles/calendarStyles';
import type { CompanySchedule, ScheduleType } from '@/types/companyItems';

const { primary: PRIMARY, successStrong: SUCCESS, warning: WARNING } = Palette;

const formatDateKey = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'yyyy年M月d日（EEE）HH:mm', { locale: ja });
const formatDisplayDay = (iso: string) => format(parseISO(iso), 'M月d日（EEE）', { locale: ja });
const formatTimeLabel = (iso: string) => format(parseISO(iso), 'HH:mm', { locale: ja });

type CalendarEvent = CompanySchedule & {
  progressStatus: ProgressStatusValue;
  remarks?: string;
};

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

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
          scheduleType: 'candidate' as ScheduleType,
          iso: date,
          title: company.nextAction?.trim() || undefined,
        });
      });

      if (company.confirmedDate) {
        events.push({
          companyId: company.id,
          companyName: company.name,
          progressStatus: company.progressStatus,
          remarks: company.remarks,
          scheduleType: 'confirmed' as ScheduleType,
          iso: company.confirmedDate,
          title: company.nextAction?.trim() || undefined,
        });
      }
    });

    const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const key = formatDateKey(event.iso);
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
    const monthStart = startOfMonth(focusedMonth);

    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(focusedMonth), { weekStartsOn: 0 });

    const currentSpan = differenceInCalendarDays(end, start) + 1;
    const needed = 42 - currentSpan;

    if (needed > 0) {
      return eachDayOfInterval({
        start: start,
        end: addDays(end, needed),
      });
    }

    return eachDayOfInterval({ start, end });
  }, [focusedMonth]);
  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    for (let index = 0; index < calendarDays.length; index += 7) {
      weeks.push(calendarDays.slice(index, index + 7));
    }
    return weeks;
  }, [calendarDays]);

  const handleSelectDay = useCallback((key: string, hasEvents: boolean) => {
    setSelectedDate(key);
    if (hasEvents) {
      setActiveDayKey(key);
    } else {
      setActiveDayKey(null);
      setActiveEvent(null);
    }
  }, []);

  const activeDayEvents = useMemo(() => {
    if (!activeDayKey) return [];
    const events = eventsByDay[activeDayKey] ?? [];
    return [...events].sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
  }, [activeDayKey, eventsByDay]);

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
              <View key={`${week[0].toISOString()}-${weekIndex}`} style={[styles.weekRow]}>
                {week.map((day) => {
                  const key = toDateKey(day);
                  const dayEvents = eventsByDay[key] ?? [];
                  const isCurrentMonth = isSameMonth(day, focusedMonth);
                  const isSelected = key === selectedDate;
                  const today = isToday(day);

                  const sortedDayEvents = [...dayEvents].sort(
                    (a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime(),
                  );

                  const MAX_VISIBLE_EVENTS_PER_DAY = 2;
                  const visibleEvents = sortedDayEvents.slice(0, MAX_VISIBLE_EVENTS_PER_DAY);
                  const remainingCount = dayEvents.length - visibleEvents.length;

                  return (
                    <Pressable
                      key={key}
                      style={[styles.dayCell, !isCurrentMonth && styles.outsideCell]}
                      onPress={() => handleSelectDay(key, dayEvents.length > 0)}
                    >
                      <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                        <View style={styles.dayHeader}>
                          {today ? (
                            <View style={styles.todayPill}>
                              <ThemedText style={styles.todayPillText}>
                                {format(day, 'd')}
                              </ThemedText>
                            </View>
                          ) : (
                            <ThemedText
                              style={[styles.dayNumber, !isCurrentMonth && styles.outsideDayNumber]}
                            >
                              {format(day, 'd')}
                            </ThemedText>
                          )}
                        </View>

                        {visibleEvents.length > 0 && (
                          <View style={styles.dayEventList}>
                            {visibleEvents.map((event, index) => {
                              const isConfirmed = event.scheduleType === 'confirmed';
                              return (
                                <View
                                  key={`${event.companyId}-${event.iso}-${event.scheduleType}-${index}`}
                                  style={[
                                    styles.daySummaryRow,
                                    isConfirmed
                                      ? styles.daySummaryRowConfirmed
                                      : styles.daySummaryRowCandidate,
                                  ]}
                                >
                                  <ThemedText
                                    style={[
                                      styles.daySummaryText,
                                      isConfirmed
                                        ? styles.daySummaryTextConfirmed
                                        : styles.daySummaryTextCandidate,
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="clip"
                                  >
                                    {event.title?.trim() || event.companyName}
                                  </ThemedText>
                                </View>
                              );
                            })}

                            {remainingCount > 0 && (
                              <ThemedText style={styles.daySummaryMore}>
                                +{remainingCount}
                              </ThemedText>
                            )}
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
                      key={`${event.companyId}-${event.iso}-${event.scheduleType}`}
                      style={styles.dayModalItem}
                      onPress={() => setActiveEvent(event)}
                    >
                      <View style={styles.dayModalMeta}>
                        <View style={styles.dayModalTime}>
                          <MaterialIcons
                            name={
                              event.scheduleType === 'confirmed' ? 'event-available' : 'event-note'
                            }
                            size={16}
                            color={event.scheduleType === 'confirmed' ? SUCCESS : WARNING}
                          />
                          <ThemedText style={styles.dayModalTimeText}>
                            {formatTimeLabel(event.iso)}
                          </ThemedText>
                        </View>
                        <View style={styles.dayModalInfo}>
                          <ThemedText style={styles.dayModalTitle}>
                            {event.title ?? event.companyName}
                          </ThemedText>
                          {event.title ? (
                            <ThemedText style={styles.dayModalCompany}>
                              {event.companyName}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>
                      <StatusTag type={event.scheduleType} />
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
                {activeEvent?.title ?? activeEvent?.companyName ?? ''}
              </ThemedText>
              {activeEvent?.title ? (
                <ThemedText style={styles.modalSubtitle}>{activeEvent?.companyName}</ThemedText>
              ) : null}
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>日時</ThemedText>
                <ThemedText style={styles.modalValue}>
                  {activeEvent ? formatDisplayDate(activeEvent.iso) : ''}
                </ThemedText>
              </View>
              <View style={styles.modalSection}>
                <ThemedText style={styles.modalLabel}>区分</ThemedText>
                <StatusTag type={activeEvent?.scheduleType ?? 'candidate'} />
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

function StatusTag({ type }: { type: ScheduleType }) {
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
