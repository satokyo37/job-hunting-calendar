import DateTimePicker, { AndroidNativeProps } from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ScheduleChip } from '@/components/ScheduleChip';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

type PickerStage = 'date' | 'time' | 'confirm';

export type SchedulePickerModalProps = {
  visible: boolean;
  status: 'candidate' | 'confirmed';
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (iso: string) => void;
};

const formatDateLabel = (date: Date) => format(date, 'yyyy年M月d日（EEE）', { locale: ja });
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
  const [webDateInput, setWebDateInput] = useState(format(baseDate, 'yyyy-MM-dd'));
  const [webTimeInput, setWebTimeInput] = useState(format(baseDate, 'HH:mm'));

  useEffect(() => {
    if (visible) {
      setStage('date');
      setWorkingDate(baseDate);
      setWebDateInput(format(baseDate, 'yyyy-MM-dd'));
      setWebTimeInput(format(baseDate, 'HH:mm'));
    }
  }, [baseDate, visible]);

  if (!visible) {
    return null;
  }

  const handleDatePart = (selected: Date) => {
    setWorkingDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      return next;
    });
    setWebDateInput(format(selected, 'yyyy-MM-dd'));
  };

  const handleTimePart = (selected: Date) => {
    setWorkingDate((prev) => {
      const next = new Date(prev);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      return next;
    });
    setWebTimeInput(format(selected, 'HH:mm'));
  };

  const handleDateStageNext = () => {
    if (Platform.OS === 'web') {
      const parsed = parse(webDateInput.trim(), 'yyyy-MM-dd', new Date());
      if (Number.isNaN(parsed.getTime())) {
        Alert.alert('無効な日付', 'YYYY-MM-DD 形式で入力してください。');
        return;
      }
      handleDatePart(parsed);
    }
    setStage('time');
  };

  const handleTimeStageNext = () => {
    if (Platform.OS === 'web') {
      const parsed = parse(webTimeInput.trim(), 'HH:mm', new Date());
      if (Number.isNaN(parsed.getTime())) {
        Alert.alert('無効な時刻', 'HH:mm 形式で入力してください。');
        return;
      }
      handleTimePart(parsed);
    }
    setStage('confirm');
  };

  const handleConfirm = () => {
    onConfirm(workingDate.toISOString());
  };

  const handleAndroidDateChange: NonNullable<AndroidNativeProps['onChange']> = (event, selected) => {
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    handleDatePart(selected);
    if (stage === 'date') {
      setStage('time');
    }
  };

  const handleAndroidTimeChange: NonNullable<AndroidNativeProps['onChange']> = (event, selected) => {
    if (event.type === 'dismissed' || !selected) {
      return;
    }
    handleTimePart(selected);
    if (stage === 'time') {
      setStage('confirm');
    }
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
              <>
                <ThemedText style={styles.stageLabel}>まず日付を選びましょう</ThemedText>
                {Platform.OS === 'web' ? (
                  <TextInput
                    style={[styles.input, styles.webInput]}
                    placeholder="YYYY-MM-DD"
                    value={webDateInput}
                    onChangeText={setWebDateInput}
                    inputMode="numeric"
                  />
                ) : Platform.OS === 'ios' ? (
                  <DateTimePicker
                    mode="date"
                    display="inline"
                    value={workingDate}
                    onChange={(_, selected) => {
                      if (selected) {
                        handleDatePart(selected);
                      }
                    }}
                  />
                ) : (
                  <DateTimePicker
                    mode="date"
                    display="calendar"
                    value={workingDate}
                    onChange={handleAndroidDateChange}
                  />
                )}
                <ThemedText style={styles.previewText}>
                  選択中: {formatDateLabel(workingDate)}
                </ThemedText>
              </>
            ) : null}

            {stage === 'time' ? (
              <>
                <ThemedText style={styles.stageLabel}>次に時間を選びましょう</ThemedText>
                {Platform.OS === 'web' ? (
                  <TextInput
                    style={[styles.input, styles.webInput]}
                    placeholder="HH:mm"
                    value={webTimeInput}
                    onChangeText={setWebTimeInput}
                    inputMode="numeric"
                  />
                ) : Platform.OS === 'ios' ? (
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    value={workingDate}
                    onChange={(_, selected) => {
                      if (selected) {
                        handleTimePart(selected);
                      }
                    }}
                  />
                ) : (
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    value={workingDate}
                    is24Hour
                    onChange={handleAndroidTimeChange}
                  />
                )}
                <ThemedText style={styles.previewText}>
                  選択中: {formatTimeLabel(workingDate)} 頃
                </ThemedText>
              </>
            ) : null}

            {stage === 'confirm' ? (
              <>
                <ThemedText style={styles.stageLabel}>この内容で登録しますか？</ThemedText>
                <ScheduleChip iso={workingDate.toISOString()} status={status} />
              </>
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
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    padding: 24,
    gap: 18,
  },
  title: {
    textAlign: 'center',
  },
  stageLabel: {
    color: '#1E293B',
    fontWeight: '600',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  webInput: {
    fontVariant: ['tabular-nums'],
  },
  previewText: {
    color: '#64748B',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
    fontWeight: '600',
  },
  primaryAction: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
