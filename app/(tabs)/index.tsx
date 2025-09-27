import DateTimePicker from '@react-native-community/datetimepicker';
import { Link } from 'expo-router';
import { format, parse, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

import { SafeAreaView } from 'react-native-safe-area-context';

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'yyyy年M月d日 (EEE) HH:mm', { locale: ja });

const formatManualInput = (date: Date) => format(date, 'yyyy-MM-dd HH:mm');

const parseManualInput = (value: string) => parse(value, 'yyyy-MM-dd HH:mm', new Date());

type CandidatePickerState = {
  companyId: string | null;
  visible: boolean;
  date: Date;
};

type ProgressEditorState = {
  companyId: string | null;
  visible: boolean;
  value: string;
};

const initialCandidatePickerState: CandidatePickerState = {
  companyId: null,
  visible: false,
  date: new Date(),
};

const initialProgressEditorState: ProgressEditorState = {
  companyId: null,
  visible: false,
  value: '',
};

export default function HomeScreen() {
  const companies = useAppStore((state) => state.companies);
  const createCompany = useAppStore((state) => state.createCompany);
  const addCandidateDate = useAppStore((state) => state.addCandidateDate);
  const removeCandidateDate = useAppStore((state) => state.removeCandidateDate);
  const confirmCandidateDate = useAppStore((state) => state.confirmCandidateDate);
  const updateCompany = useAppStore((state) => state.updateCompany);

  const [isFormOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProgress, setFormProgress] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [pickerState, setPickerState] = useState(initialCandidatePickerState);
  const [progressEditor, setProgressEditor] = useState(initialProgressEditorState);
  const [webCandidateInput, setWebCandidateInput] = useState(formatManualInput(new Date()));

  const resetForm = useCallback(() => {
    setFormName('');
    setFormProgress('');
    setFormRemarks('');
  }, []);

  const toggleForm = useCallback(() => {
    setFormOpen((prev) => !prev);
  }, []);

  const handleCreateCompany = useCallback(() => {
    const name = formName.trim();
    const progress = formProgress.trim();

    if (!name || !progress) {
      Alert.alert('入力エラー', '企業名と進捗ステータスを入力してください。');
      return;
    }

    createCompany({
      name,
      progressStatus: progress,
      remarks: formRemarks.trim() || undefined,
    });

    resetForm();
    setFormOpen(false);
  }, [createCompany, formName, formProgress, formRemarks, resetForm]);

  const openCandidatePicker = useCallback((companyId: string) => {
    const now = new Date();
    setPickerState({ companyId, visible: true, date: now });
    if (Platform.OS === 'web') {
      setWebCandidateInput(formatManualInput(now));
    }
  }, []);

  const closeCandidatePicker = useCallback(() => {
    setPickerState(initialCandidatePickerState);
  }, []);

  const handleCandidateConfirm = useCallback(() => {
    if (!pickerState.companyId) {
      return;
    }
    if (Number.isNaN(pickerState.date.getTime())) {
      Alert.alert('無効な日付', 'YYYY-MM-DD HH:mm 形式で入力してください。');
      return;
    }
    addCandidateDate(pickerState.companyId, pickerState.date.toISOString());
    closeCandidatePicker();
  }, [addCandidateDate, closeCandidatePicker, pickerState]);

  const openProgressEditor = useCallback((companyId: string, currentStatus: string) => {
    setProgressEditor({ companyId, visible: true, value: currentStatus });
  }, []);

  const closeProgressEditor = useCallback(() => {
    setProgressEditor(initialProgressEditorState);
  }, []);

  const handleProgressSave = useCallback(() => {
    const targetId = progressEditor.companyId;
    if (!targetId) {
      return;
    }
    const nextStatus = progressEditor.value.trim();
    if (!nextStatus) {
      Alert.alert('入力エラー', '進捗ステータスを入力してください。');
      return;
    }
    updateCompany(targetId, { progressStatus: nextStatus });
    closeProgressEditor();
  }, [closeProgressEditor, progressEditor, updateCompany]);

  const sortedCompanies = useMemo(
    () =>
      [...companies].sort((a, b) => {
        const aDate = a.confirmedDate ?? a.candidateDates[0];
        const bDate = b.confirmedDate ?? b.candidateDates[0];

        if (!aDate && !bDate) return a.name.localeCompare(b.name);
        if (!aDate) return 1;
        if (!bDate) return -1;

        return new Date(aDate).getTime() - new Date(bDate).getTime();
      }),
    [companies]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
        <View>
          <ThemedText type="title">企業一覧</ThemedText>
          <ThemedText type="subtitle">進捗と面談日程をひと目で確認</ThemedText>
        </View>
        <Pressable style={styles.addButton} onPress={toggleForm}>
          <ThemedText style={styles.addButtonLabel}>＋企業を追加</ThemedText>
        </Pressable>
      </View>

      {sortedCompanies.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText type="subtitle">まだ企業が登録されていません。</ThemedText>
          <ThemedText>右上の「＋企業を追加」から登録を始めましょう。</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={sortedCompanies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <ThemedText type="title" style={styles.companyName}>
                  {item.name}
                </ThemedText>
                <Pressable
                  onPress={() => openProgressEditor(item.id, item.progressStatus)}
                  style={styles.statusBadge}
                >
                  <ThemedText style={styles.statusBadgeLabel}>{item.progressStatus}</ThemedText>
                </Pressable>
              </View>

              {item.remarks ? (
                <ThemedText style={styles.remarks}>{item.remarks}</ThemedText>
              ) : null}

              {item.confirmedDate ? (
                <View style={styles.confirmedBlock}>
                  <ThemedText type="defaultSemiBold">確定日程</ThemedText>
                  <ThemedText>{formatDisplayDate(item.confirmedDate)}</ThemedText>
                </View>
              ) : (
                <View style={styles.noConfirmedBlock}>
                  <ThemedText type="defaultSemiBold">確定日程</ThemedText>
                  <ThemedText>未確定</ThemedText>
                </View>
              )}

              <View style={styles.candidateHeader}>
                <ThemedText type="defaultSemiBold">候補日</ThemedText>
                <Pressable style={styles.inlineButton} onPress={() => openCandidatePicker(item.id)}>
                  <ThemedText style={styles.inlineButtonLabel}>候補日を追加</ThemedText>
                </Pressable>
              </View>

              {item.candidateDates.length === 0 ? (
                <ThemedText style={styles.placeholder}>候補日は登録されていません。</ThemedText>
              ) : (
                item.candidateDates.map((candidate) => (
                  <View style={styles.candidateRow} key={candidate}>
                    <ThemedText style={styles.candidateText}>{formatDisplayDate(candidate)}</ThemedText>
                    <View style={styles.candidateActions}>
                      <Pressable
                        onPress={() => confirmCandidateDate(item.id, candidate)}
                        style={[styles.inlineButton, styles.confirmButton]}
                      >
                        <ThemedText style={styles.confirmButtonLabel}>確定</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => removeCandidateDate(item.id, candidate)}
                        style={[styles.inlineButton, styles.removeButton]}
                      >
                        <ThemedText style={styles.removeButtonLabel}>削除</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ThemedView>
          )}
        />
      )}

      <Link href="/(tabs)/calendar" asChild>
        <Pressable style={styles.calendarShortcut}>
          <ThemedText style={styles.calendarShortcutLabel}>カレンダーで確認</ThemedText>
        </Pressable>
      </Link>

      <Modal visible={isFormOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              企業を登録
            </ThemedText>
            <TextInput
              placeholder="ä¼æ¥­å"
              value={formName}
              onChangeText={setFormName}
              style={styles.input}
            />
            <TextInput
              placeholder="é²æã¹ãã¼ã¿ã¹ï¼ä¾ï¼ESæåºæ¸ã¿ï¼"
              value={formProgress}
              onChangeText={setFormProgress}
              style={styles.input}
            />
            <TextInput
              placeholder="ã¡ã¢ï¼ä»»æï¼"
              value={formRemarks}
              onChangeText={setFormRemarks}
              multiline
              style={[styles.input, styles.multilineInput]}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalButton}
                onPress={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                <ThemedText style={styles.modalButtonLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={handleCreateCompany}
              >
                <ThemedText style={styles.modalPrimaryLabel}>追加</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal visible={progressEditor.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              進捗ステータスを更新
            </ThemedText>
            <TextInput
              placeholder="é²æã¹ãã¼ã¿ã¹"
              value={progressEditor.value}
              onChangeText={(text) => setProgressEditor((prev) => ({ ...prev, value: text }))}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={closeProgressEditor}>
                <ThemedText style={styles.modalButtonLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={handleProgressSave}
              >
                <ThemedText style={styles.modalPrimaryLabel}>保存</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <Modal visible={pickerState.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.pickerContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              候補日を選択
            </ThemedText>
            {Platform.OS === 'web' ? (
              <View style={styles.webPicker}>
                <TextInput
                  style={[styles.input, styles.webInput]}
                  placeholder="YYYY-MM-DD HH:mm"
                  value={webCandidateInput}
                  onChangeText={(value) => {
                    setWebCandidateInput(value);
                    const parsed = parseManualInput(value);
                    if (!Number.isNaN(parsed.getTime())) {
                      setPickerState((prev) => ({ ...prev, date: parsed }));
                    }
                  }}
                />
                <ThemedText style={styles.webPickerHint}>YYYY-MM-DD HH:mm 形式ï¼24時間ï¼で入力してくださいã</ThemedText>
                <ThemedText style={styles.webPickerHint}>例: 2025-04-15 13:30 (24時間表記)</ThemedText>
              </View>
            ) : (
              <DateTimePicker
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                value={pickerState.date}
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setPickerState((prev) => ({ ...prev, date: selectedDate }));
                  }
                }}
              />
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={closeCandidatePicker}>
                <ThemedText style={styles.modalButtonLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={handleCandidateConfirm}
              >
                <ThemedText style={styles.modalPrimaryLabel}>追加</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    borderRadius: 12,
    gap: 8,
  },
  listContent: {
    gap: 16,
    paddingBottom: 120,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyName: {
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeLabel: {
    fontWeight: '600',
  },
  remarks: {
    color: '#6b7280',
  },
  confirmedBlock: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    gap: 4,
  },
  noConfirmedBlock: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    gap: 4,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
  },
  inlineButtonLabel: {
    color: '#2563eb',
    fontWeight: '600',
  },
  placeholder: {
    color: '#9ca3af',
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  candidateText: {
    flex: 1,
  },
  candidateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  confirmButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  removeButton: {
    borderColor: '#ef4444',
  },
  removeButtonLabel: {
    color: '#ef4444',
    fontWeight: '600',
  },
  calendarShortcut: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarShortcutLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  pickerContent: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    textAlign: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1d5db',
  },
  modalButtonLabel: {
    fontWeight: '600',
  },
  modalPrimaryButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  modalPrimaryLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  webPicker: {
    gap: 8,
  },
  webPickerHint: {
    color: '#6b7280',
    fontSize: 12,
  },
  webInput: {
    fontSize: 16,
  },
});







