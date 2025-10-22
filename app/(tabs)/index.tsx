import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parse, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
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

const BACKGROUND = '#F2F6FF';
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F8FAFF';
const BORDER = '#D8E3FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#16A34A';
const WARNING = '#F97316';
const DANGER = '#EF4444';

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
  const [pickerState, setPickerState] = useState<CandidatePickerState>({
    companyId: null,
    visible: false,
    date: new Date(),
  });
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
    setPickerState((prev) => ({
      ...prev,
      companyId: null,
      visible: false,
    }));
    if (Platform.OS === 'web') {
      const nextDefault = formatManualInput(new Date());
      setWebCandidateInput(nextDefault);
    }
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
        <View style={styles.heroCard}>
          <View style={styles.heroText}>
            <ThemedText type="title" style={styles.heroTitle}>
              企業一覧
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroSubtitle}>
              進捗と面談日程をひと目で確認
            </ThemedText>
          </View>
          <Pressable style={styles.primaryButton} onPress={toggleForm}>
            <MaterialIcons name="add-circle" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonLabel}>企業を追加</ThemedText>
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
                  <View style={styles.confirmedHeader}>
                    <MaterialIcons name="event-available" size={18} color={SUCCESS} />
                    <ThemedText type="defaultSemiBold" style={styles.confirmedLabel}>
                      確定日程
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.confirmedValue}>
                    {formatDisplayDate(item.confirmedDate)}
                  </ThemedText>
                </View>
              ) : (
                <View style={[styles.confirmedBlock, styles.pendingBlock]}>
                  <View style={styles.confirmedHeader}>
                    <MaterialIcons name="event-busy" size={18} color={WARNING} />
                    <ThemedText type="defaultSemiBold" style={styles.pendingLabel}>
                      確定日程
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.pendingValue}>未確定</ThemedText>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  候補日
                </ThemedText>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => openCandidatePicker(item.id)}
                >
                  <MaterialIcons name="add" size={16} color={PRIMARY} />
                  <ThemedText style={styles.secondaryButtonLabel}>候補日を追加</ThemedText>
                </Pressable>
              </View>

              {item.candidateDates.length === 0 ? (
                <ThemedText style={styles.placeholder}>候補日は登録されていません。</ThemedText>
              ) : (
                item.candidateDates.map((candidate) => (
                  <View style={styles.candidateRow} key={candidate}>
                    <View style={styles.candidateInfo}>
                      <View style={styles.candidateIcon}>
                        <MaterialIcons name="event" size={16} color={PRIMARY} />
                      </View>
                      <ThemedText style={styles.candidateDate}>
                        {formatDisplayDate(candidate)}
                      </ThemedText>
                    </View>
                    <View style={styles.candidateActions}>
                      <Pressable
                        onPress={() => confirmCandidateDate(item.id, candidate)}
                        style={[styles.actionChip, styles.confirmAction]}
                      >
                        <MaterialIcons name="check-circle" size={16} color={SUCCESS} />
                        <ThemedText style={[styles.actionChipLabel, styles.confirmActionLabel]}>
                          確定
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => removeCandidateDate(item.id, candidate)}
                        style={[styles.actionChip, styles.deleteAction]}
                      >
                        <MaterialIcons name="delete" size={16} color={DANGER} />
                        <ThemedText style={[styles.actionChipLabel, styles.deleteActionLabel]}>
                          削除
                        </ThemedText>
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
          <MaterialIcons name="calendar-today" size={18} color="#FFFFFF" />
          <ThemedText style={styles.calendarShortcutLabel}>カレンダーで確認</ThemedText>
        </Pressable>
      </Link>

      <Modal visible={isFormOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, styles.formModal]}>
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
          <ThemedView style={[styles.modalCard, styles.formModal]}>
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
          <ThemedView style={[styles.modalCard, styles.pickerModal]}>
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
                onChange={(event, selectedDate) => {
                  if (event?.type === 'dismissed') {
                    closeCandidatePicker();
                    return;
                  }
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
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 20,
    shadowColor: '#CBD5F5',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: TEXT_MUTED,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 2,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 8,
  },
  listContent: {
    gap: 16,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 16,
    shadowColor: '#E0E9FF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  companyName: {
    flexShrink: 1,
    color: TEXT_PRIMARY,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  statusBadgeLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  remarks: {
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  confirmedBlock: {
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 16,
    gap: 8,
  },
  confirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmedLabel: {
    color: TEXT_PRIMARY,
  },
  confirmedValue: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  pendingBlock: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  pendingLabel: {
    color: WARNING,
  },
  pendingValue: {
    color: WARNING,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  secondaryButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  candidateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  candidateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateDate: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    flexShrink: 1,
  },
  candidateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionChipLabel: {
    fontWeight: '600',
  },
  confirmAction: {
    backgroundColor: 'rgba(22, 163, 74, 0.16)',
  },
  confirmActionLabel: {
    color: SUCCESS,
  },
  deleteAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  deleteActionLabel: {
    color: DANGER,
  },
  calendarShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  calendarShortcutLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 18,
  },
  formModal: {
    gap: 18,
  },
  pickerModal: {
    gap: 20,
  },
  modalTitle: {
    textAlign: 'center',
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: SURFACE,
    color: TEXT_PRIMARY,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  modalButtonLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  modalPrimaryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webPicker: {
    gap: 12,
  },
  webPickerHint: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  webInput: {
    fontSize: 16,
  },
});
