
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
import { useEffect, useMemo, useState } from 'react';
import { ja } from 'date-fns/locale';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const formatDateKey = (iso: string) => format(parseISO(iso), 'yyyy-MM-dd');
const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'yyyy年M月d日 (EEE) HH:mm', { locale: ja });

interface CalendarEvent {
  companyId: string;
  companyName: string;
  type: 'candidate' | 'confirmed';
  dateTime: string;
}

const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
const COLUMN_WIDTH = '14.29%';

export default function CalendarScreen() {
  const companies = useAppStore((state) => state.companies);

  const { eventsByDay, eventDays } = useMemo(() => {
    const events: CalendarEvent[] = [];

    companies.forEach((company) => {
      company.candidateDates.forEach((date) => {
        events.push({
          companyId: company.id,
          companyName: company.name,
          type: 'candidate',
          dateTime: date,
        });
      });

      if (company.confirmedDate) {
        events.push({
          companyId: company.id,
          companyName: company.name,
          type: 'confirmed',
          dateTime: company.confirmedDate,
        });
      }
    });

    const sortedEvents = events.sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    const grouped = sortedEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const key = formatDateKey(event.dateTime);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    const days = Object.keys(grouped).sort();

    return {
      eventsByDay: grouped,
      eventDays: days,
    };
  }, [companies]);

  const todayKey = toDateKey(new Date());
  const initialSelected = eventDays[0] ?? todayKey;
  const [selectedDate, setSelectedDate] = useState(initialSelected);
  const [focusedMonth, setFocusedMonth] = useState(startOfMonth(parseISO(initialSelected)));

  useEffect(() => {
    if (eventDays.length === 0) {
      setSelectedDate(todayKey);
      setFocusedMonth(startOfMonth(new Date()));
      return;
    }

    if (!eventsByDay[selectedDate]) {
      const nextSelected = eventDays[0];
      setSelectedDate(nextSelected);
            setFocusedMonth(startOfMonth(parseISO(nextSelected)));
    }
  }, [eventDays, eventsByDay, selectedDate, todayKey]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(focusedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(focusedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [focusedMonth]);

  useEffect(() => {
    const selected = parseISO(selectedDate);
    setFocusedMonth(startOfMonth(selected));
  }, [selectedDate]);

  const selectedEvents = eventsByDay[selectedDate] ?? [];

  const handleMonthChange = (direction: 1 | -1) => {
    setFocusedMonth((prev) => addMonths(prev, direction));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title">カレンダー</ThemedText>
            <ThemedText type="subtitle">候補日と確定日程をまとめて確認</ThemedText>
          </View>
          <View style={styles.monthSwitcher}>
            <Pressable style={styles.navButton} onPress={() => handleMonthChange(-1)}>
              <ThemedText style={styles.navButtonLabel}>{'<'}</ThemedText>
            </Pressable>
            <ThemedText type="defaultSemiBold" style={styles.monthLabel}>
              {format(focusedMonth, 'yyyy年M月', { locale: ja })}
            </ThemedText>
            <Pressable style={styles.navButton} onPress={() => handleMonthChange(1)}>
              <ThemedText style={styles.navButtonLabel}>{'>'}</ThemedText>
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
            const isCurrentMonth = isSameMonth(day, focusedMonth);
            const hasEvents = Boolean(eventsByDay[key]);
            const isSelected = key === selectedDate;
            const today = isToday(day);

            return (
              <Pressable
                key={key}
                style={[styles.dayCell, !isCurrentMonth && styles.outsideCell]}
                onPress={() => {
                  setSelectedDate(key);
                }}
              >
                <View
                  style={[
                    styles.dayNumberWrapper,
                    isSelected && styles.selectedDay,
                    today && !isSelected && styles.todayDay,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      !isCurrentMonth && styles.outsideDayNumber,
                      isSelected && styles.selectedDayNumber,
                    ]}
                  >
                    {format(day, 'd')}
                  </ThemedText>
                </View>
                {hasEvents ? (
                  <View style={styles.eventDotContainer}>
                    {eventsByDay[key]!.map((event) => (
                      <View
                        key={`${event.companyId}-${event.type}`}
                        style={[
                          styles.eventDot,
                          event.type === 'confirmed' ? styles.confirmDot : styles.candidateDot,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.eventHeader}>
          <ThemedText type="defaultSemiBold">
            {format(parseISO(`${selectedDate}T00:00:00`), 'yyyy年M月d日 (EEE)', { locale: ja })}
          </ThemedText>
          <ThemedText>
            {selectedEvents.length > 0
              ? `${selectedEvents.length}ä»¶ã®äºå®`
              : 'äºå®ã¯ããã¾ãã'}
          </ThemedText>
        </View>

        {selectedEvents.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText>ãã®æ¥ã®äºå®ã¯ç»é²ããã¦ãã¾ããã</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={selectedEvents}
            keyExtractor={(item, index) => `${item.companyId}-${item.type}-${index}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <ThemedView style={styles.eventCard}>
                <ThemedText type="defaultSemiBold">{item.companyName}</ThemedText>
                <ThemedText>{formatDisplayDate(item.dateTime)}</ThemedText>
                <ThemedText
                  style={item.type === 'confirmed' ? styles.confirmedLabel : styles.candidateLabel}
                >
                  {item.type === 'confirmed' ? 'ç¢ºå®' : 'åè£'}
                </ThemedText>
              </ThemedView>
            )}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthLabel: {
    minWidth: 120,
    textAlign: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekDay: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: COLUMN_WIDTH,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  outsideCell: {
    opacity: 0.4,
  },
  dayNumberWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  outsideDayNumber: {
    color: '#6b7280',
  },
  selectedDay: {
    backgroundColor: '#2563eb',
  },
  selectedDayNumber: {
    color: '#ffffff',
  },
  todayDay: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2563eb',
  },
  eventDotContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confirmDot: {
    backgroundColor: '#2563eb',
  },
  candidateDot: {
    backgroundColor: '#f59e0b',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  listContent: {
    gap: 12,
    paddingBottom: 48,
  },
  eventCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  confirmedLabel: {
    color: '#2563eb',
    fontWeight: '600',
  },
  candidateLabel: {
    color: '#f59e0b',
    fontWeight: '600',
  },
});
