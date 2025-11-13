import { Picker } from '@react-native-picker/picker';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ScheduleChip } from '@/components/ScheduleChip';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { NOTO_SANS_JP } from '@/constants/Typography';

type PickerStage = 'date' | 'time' | 'confirm';

export type SchedulePickerModalProps = {
  visible: boolean;
  status: 'candidate' | 'confirmed' | 'task';
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (iso: string) => void;
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const HOUR_LABEL = '時間';
const MINUTE_LABEL = '分';
const formatDateLabel = (date: Date) => format(date, "yyyy'年'MM'月'd'日'(EEE)", { locale: ja });
const formatTimeLabel = (date: Date) => format(date, 'HH:mm');

export function SchedulePickerModal({
  visible,
  status,
  initialValue,
  onCancel,
  onConfirm,
}: SchedulePickerModalProps) {
  const baseDate = useMemo(() => {
    if (!initialValue) {
      return new Date();
    }
    const parsed = new Date(initialValue);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [initialValue]);

  const [stage, setStage] = useState<PickerStage>('date');
  const [workingDate, setWorkingDate] = useState<Date>(baseDate);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(baseDate));

  useEffect(() => {
    if (visible) {
      setStage('date');
      setWorkingDate(baseDate);
      setCalendarMonth(startOfMonth(baseDate));
    }
  }, [baseDate, visible]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { locale: ja });
    const end = endOfWeek(endOfMonth(calendarMonth), { locale: ja });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const today = useMemo(() => new Date(), []);
  const selectedHour = workingDate.getHours();
  const selectedMinute = workingDate.getMinutes();

  if (!visible) {
    return null;
  }

  const handleDatePart = (selected: Date) => {
    setWorkingDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    });
    setCalendarMonth(startOfMonth(selected));
  };

  const handleTimePart = (selected: Date) => {
    setWorkingDate((prev) => {
      const next = new Date(prev);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return next;
    });
  };

  const shiftCalendarMonth = (delta: number) => {
    setCalendarMonth((prev) => addMonths(prev, delta));
  };

  const handleHourSelect = (hour: number) => {
    const next = new Date(workingDate);
    next.setHours(hour);
    handleTimePart(next);
  };

  const handleMinuteSelect = (minute: number) => {
    const next = new Date(workingDate);
    next.setMinutes(minute);
    handleTimePart(next);
  };

  const handleDateStageNext = () => {
    setStage('time');
  };

  const handleTimeStageNext = () => {
    setStage('confirm');
  };

  const handleConfirm = () => {
    onConfirm(workingDate.toISOString());
  };

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.shell} onPress={(event) => event.stopPropagation()}>
          <ThemedView style={styles.card}>
            <ThemedText type="title" style={styles.title}>
              日時を選択
            </ThemedText>

            {stage === 'date' ? (
              <View style={styles.stageSection}>
                <ThemedText style={styles.stageLabel}>まず日付を選びましょう</ThemedText>
                <View style={styles.calendar}>
                  <View style={styles.calendarHeader}>
                    <Pressable
                      accessibilityLabel="前の月へ"
                      style={styles.calendarNavButton}
                      onPress={() => shiftCalendarMonth(-1)}
                    >
                      <ThemedText style={styles.calendarNavLabel}>{'<'}</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.calendarMonthLabel}>
                      {format(calendarMonth, "yyyy'年'MM'月'", { locale: ja })}
                    </ThemedText>
                    <Pressable
                      accessibilityLabel="次の月へ"
                      style={styles.calendarNavButton}
                      onPress={() => shiftCalendarMonth(1)}
                    >
                      <ThemedText style={styles.calendarNavLabel}>{'>'}</ThemedText>
                    </Pressable>
                  </View>

                  <View style={styles.weekdayRow}>
                    {WEEKDAY_LABELS.map((label) => (
                      <ThemedText key={label} style={styles.weekdayLabel}>
                        {label}
                      </ThemedText>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {calendarDays.map((day) => {
                      const isSelected = isSameDay(day, workingDate);
                      const isOutside = !isSameMonth(day, calendarMonth);
                      const isToday = isSameDay(day, today);

                      return (
                        <Pressable
                          key={day.toISOString()}
                          onPress={() => handleDatePart(day)}
                          style={[
                            styles.dayCell,
                            isOutside && styles.dayCellOutside,
                            isSelected && styles.dayCellSelected,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.dayCellLabel,
                              isOutside && styles.dayCellLabelOutside,
                              isSelected && styles.dayCellLabelSelected,
                            ]}
                          >
                            {format(day, 'd')}
                          </ThemedText>
                          {isToday ? (
                            <View
                              style={[
                                styles.todayDot,
                                isSelected && styles.todayDotSelected,
                              ]}
                            />
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <ThemedText style={styles.previewText}>
                  選択: {formatDateLabel(workingDate)}
                </ThemedText>
              </View>
            ) : null}

            {stage === 'time' ? (
              <View style={styles.stageSection}>
                <ThemedText style={styles.stageLabel}>次に時間を選びましょう</ThemedText>
                <View style={styles.timePicker}>
                  <View style={styles.timeDropdown}>
                    <ThemedText style={styles.timeSectionLabel}>{HOUR_LABEL}</ThemedText>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={selectedHour}
                        onValueChange={(value) => handleHourSelect(value)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        dropdownIconColor="#0F172A"
                      >
                        {HOURS.map((hour) => (
                          <Picker.Item
                            key={`hour-${hour}`}
                            label={`${hour} 時`}
                            value={hour}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.timeDropdown}>
                    <ThemedText style={styles.timeSectionLabel}>{MINUTE_LABEL}</ThemedText>
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={selectedMinute}
                        onValueChange={(value) => handleMinuteSelect(value)}
                        style={styles.picker}
                        itemStyle={styles.pickerItem}
                        dropdownIconColor="#0F172A"
                      >
                        {MINUTES.map((minute) => (
                          <Picker.Item
                            key={`minute-${minute}`}
                            label={`${minute} 分`}
                            value={minute.toString()}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
                <ThemedText style={styles.previewText}>
                  選択: {formatTimeLabel(workingDate)}
                </ThemedText>
              </View>
            ) : null}

            {stage === 'confirm' ? (
              <View style={styles.stageSection}>
                <ThemedText style={styles.stageLabel}>この内容で登録しますか？</ThemedText>
                <ScheduleChip iso={workingDate.toISOString()} status={status} />
              </View>
            ) : null}

            <View style={styles.actions}>
              {stage === 'date' ? (
                <>
                  <Pressable style={styles.actionButton} onPress={onCancel}>
                    <ThemedText style={styles.actionLabel}>キャンセル</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={handleDateStageNext}
                  >
                    <ThemedText style={styles.primaryLabel}>次へ</ThemedText>
                  </Pressable>
                </>
              ) : null}

              {stage === 'time' ? (
                <>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => setStage('date')}
                  >
                    <ThemedText style={styles.actionLabel}>戻る</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={handleTimeStageNext}
                  >
                    <ThemedText style={styles.primaryLabel}>次へ</ThemedText>
                  </Pressable>
                </>
              ) : null}

              {stage === 'confirm' ? (
                <>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => setStage('time')}
                  >
                    <ThemedText style={styles.actionLabel}>戻る</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.primaryAction]}
                    onPress={handleConfirm}
                  >
                    <ThemedText style={styles.primaryLabel}>決定</ThemedText>
                  </Pressable>
                </>
              ) : null}
            </View>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  shell: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: 360,
    maxWidth: '100%',
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    padding: 24,
    gap: 18,
    height: 620,
  },
  title: {
    textAlign: 'center',
  },
  stageLabel: {
    color: '#1E293B',
    fontFamily: NOTO_SANS_JP.semibold,
  },
  stageSection: {
    gap: 2,
  },
  calendar: {
    gap: 8,
    width: 320,
    maxWidth: '100%',
    alignSelf: 'center',
    minHeight: 380,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavLabel: {
    fontFamily: NOTO_SANS_JP.bold,
    color: '#1E293B',
    fontSize: 16,
  },
  calendarMonthLabel: {
    fontFamily: NOTO_SANS_JP.semibold,
    color: '#0F172A',
    fontSize: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekdayLabel: {
    width: '14.2857%',
    textAlign: 'center',
    color: '#94A3B8',
    fontFamily: NOTO_SANS_JP.semibold,
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  dayCellOutside: {
    opacity: 0.4,
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayCellLabel: {
    fontFamily: NOTO_SANS_JP.semibold,
    color: '#0F172A',
  },
  dayCellLabelOutside: {
    color: '#94A3B8',
  },
  dayCellLabelSelected: {
    color: '#FFFFFF',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: '#2563EB',
  },
  todayDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  timePicker: {
    flexDirection: 'row',
    gap: 16,
  },
  timeDropdown: {
    flex: 1,
    gap: 8,
  },
  timeSectionLabel: {
    color: '#475569',
    fontFamily: NOTO_SANS_JP.semibold,
  },
  pickerShell: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  picker: {
    width: '100%',
    color: '#0F172A',
    textAlign: 'center',
  },
  pickerItem: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: NOTO_SANS_JP.semibold,
  },
  previewText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: NOTO_SANS_JP.semibold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 'auto',
  },
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    backgroundColor: '#F8FAFF',
  },
  actionLabel: {
    color: '#1E293B',
    fontFamily: NOTO_SANS_JP.semibold,
  },
  primaryAction: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontFamily: NOTO_SANS_JP.bold,
  },
});
