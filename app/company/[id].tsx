import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
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
const DANGER = '#EF4444';

type PickerMode = 'candidate' | 'confirmed';

type EditState = {
  visible: boolean;
  name: string;
  progress: string;
  remarks: string;
};

const initialEditState: EditState = {
  visible: false,
  name: '',
  progress: '',
  remarks: '',
};

export default function CompanyDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companyId = Array.isArray(params.id) ? params.id[0] : params.id;

  const companies = useAppStore((state) => state.companies);
  const addCandidateDate = useAppStore((state) => state.addCandidateDate);
  const removeCandidateDate = useAppStore((state) => state.removeCandidateDate);
  const confirmCandidateDate = useAppStore((state) => state.confirmCandidateDate);
  const updateCompany = useAppStore((state) => state.updateCompany);

  const company = useMemo(
    () => companies.find((candidate) => candidate.id === companyId) ?? null,
    [companies, companyId]
  );

  const [editState, setEditState] = useState<EditState>(initialEditState);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const openEdit = useCallback(() => {
    if (!company) {
      return;
    }
    setEditState({
      visible: true,
      name: company.name,
      progress: company.progressStatus,
      remarks: company.remarks ?? '',
    });
  }, [company]);

  const closeEdit = useCallback(() => {
    setEditState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleEditSave = useCallback(() => {
    if (!companyId) {
      return;
    }
    const name = editState.name.trim();
    const progress = editState.progress.trim();
    if (!name || !progress) {
      Alert.alert('入力エラー', '会社名と進捗ステータスを入力してください。');
      return;
    }
    updateCompany(companyId, {
      name,
      progressStatus: progress,
      remarks: editState.remarks.trim() || undefined,
    });
    closeEdit();
  }, [closeEdit, companyId, editState.name, editState.progress, editState.remarks, updateCompany]);

  const handlePickerOpen = useCallback(
    (mode: PickerMode) => {
      setPickerMode(mode);
      setPickerVisible(true);
    },
    []
  );

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setPickerMode(null);
  }, []);

  const handlePickerConfirm = useCallback(
    (iso: string) => {
      if (!companyId || !pickerMode) {
        return;
      }
      if (pickerMode === 'candidate') {
        addCandidateDate(companyId, iso);
      } else {
        updateCompany(companyId, { confirmedDate: iso });
      }
      handlePickerClose();
    },
    [addCandidateDate, companyId, handlePickerClose, pickerMode, updateCompany]
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'confirmed' && company?.confirmedDate) {
      return company.confirmedDate;
    }
    return undefined;
  }, [company?.confirmedDate, pickerMode]);

  const handleClearConfirmed = useCallback(() => {
    if (!companyId) {
      return;
    }
    updateCompany(companyId, { confirmedDate: undefined });
  }, [companyId, updateCompany]);

  if (!companyId || !company) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: '企業詳細' }} />
        <ThemedView style={[styles.container, styles.centered]}>
          <ThemedText type="defaultSemiBold">指定された企業が見つかりませんでした。</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const confirmedLabel = company.confirmedDate
    ? format(parseISO(company.confirmedDate), 'yyyy年M月d日（EEE）HH:mm')
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: company.name }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.headerCard}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.companyName}>
              {company.name}
            </ThemedText>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusBadgeLabel}>{company.progressStatus}</ThemedText>
            </View>
          </View>
          <Pressable style={styles.editButton} onPress={openEdit}>
            <MaterialIcons name="edit" size={18} color={PRIMARY} />
            <ThemedText style={styles.editButtonLabel}>情報を編集</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              メモ
            </ThemedText>
          </View>
          {company.remarks ? (
            <ThemedText style={styles.bodyText}>{company.remarks}</ThemedText>
          ) : (
            <ThemedText style={styles.placeholder}>メモはまだ登録されていません。</ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              確定した日程
            </ThemedText>
            <View style={styles.sectionActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => handlePickerOpen('confirmed')}
              >
                <MaterialIcons
                  name={company.confirmedDate ? 'edit-calendar' : 'event-available'}
                  size={16}
                  color={PRIMARY}
                />
                <ThemedText style={styles.actionButtonLabel}>
                  {company.confirmedDate ? '日程を変更' : '日程を設定'}
                </ThemedText>
              </Pressable>
              {company.confirmedDate ? (
                <Pressable
                  style={[styles.actionButton, styles.destructiveAction]}
                  onPress={handleClearConfirmed}
                >
                  <MaterialIcons name="close" size={16} color={DANGER} />
                  <ThemedText style={styles.destructiveLabel}>クリア</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
          {company.confirmedDate && confirmedLabel ? (
            <ScheduleChip iso={company.confirmedDate} status="confirmed" />
          ) : (
            <ThemedText style={styles.placeholder}>未設定</ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              候補日
            </ThemedText>
            <Pressable style={styles.actionButton} onPress={() => handlePickerOpen('candidate')}>
              <MaterialIcons name="add" size={16} color={PRIMARY} />
              <ThemedText style={styles.actionButtonLabel}>候補を追加</ThemedText>
            </Pressable>
          </View>

          {company.candidateDates.length === 0 ? (
            <ThemedText style={styles.placeholder}>候補日はまだ登録されていません。</ThemedText>
          ) : (
            <View style={styles.chipStack}>
              {company.candidateDates.map((candidate) => (
                <ScheduleChip
                  key={candidate}
                  iso={candidate}
                  status="candidate"
                  actions={[
                    {
                      key: 'confirm',
                      label: '確定',
                      icon: 'check-circle',
                      color: SUCCESS,
                      backgroundColor: 'rgba(22, 163, 74, 0.16)',
                      onPress: () => confirmCandidateDate(companyId, candidate),
                    },
                    {
                      key: 'delete',
                      label: '削除',
                      icon: 'delete',
                      color: DANGER,
                      backgroundColor: 'rgba(239, 68, 68, 0.16)',
                      onPress: () => removeCandidateDate(companyId, candidate),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </ThemedView>
      </ScrollView>

      <Modal transparent visible={editState.visible} animationType="slide">
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, styles.formModal]}>
            <ThemedText type="title" style={styles.modalTitle}>
              情報を編集
            </ThemedText>
            <TextInput
              placeholder="会社名"
              value={editState.name}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="進捗ステータス"
              value={editState.progress}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, progress: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="メモ"
              value={editState.remarks}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, remarks: text }))}
              multiline
              style={[styles.input, styles.multilineInput]}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalButton} onPress={closeEdit}>
                <ThemedText style={styles.modalButtonLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimaryButton]}
                onPress={handleEditSave}
              >
                <ThemedText style={styles.modalPrimaryLabel}>保存</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>

      <SchedulePickerModal
        visible={pickerVisible && Boolean(pickerMode)}
        status={pickerMode ?? 'candidate'}
        initialValue={pickerInitialValue}
        onCancel={handlePickerClose}
        onConfirm={handlePickerConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: 24,
  },
  headerCard: {
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  companyName: {
    flexShrink: 1,
    color: TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: '700',
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
  editButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  editButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  actionButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  destructiveAction: {
    borderColor: 'rgba(239, 68, 68, 0.24)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  destructiveLabel: {
    color: DANGER,
    fontWeight: '600',
  },
  bodyText: {
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  chipStack: {
    gap: 12,
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
});
