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

import { PageHeader } from '@/components/PageHeader';
import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND = '#EFF6FF';
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F8FAFF';
const BORDER = '#D9E6FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#22C55E';
const DANGER = '#F87171';

function getStatusColors(label: string) {
  const l = label.trim();
  if (/(内定)/.test(l)) {
    return { bg: 'rgba(34, 197, 94, 0.12)', fg: '#22C55E' };
  }
  if (/(選考中|面接|書類選考)/.test(l)) {
    return { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563EB' };
  }
  if (/(結果待ち|合否待ち|保留)/.test(l)) {
    return { bg: 'rgba(245, 158, 11, 0.16)', fg: '#D97706' };
  }
  if (/(不採用|落選|見送り)/.test(l)) {
    return { bg: 'rgba(248, 113, 113, 0.18)', fg: '#F87171' };
  }
  return { bg: 'rgba(37, 99, 235, 0.12)', fg: '#2563EB' };
}

type PickerMode = 'candidate' | 'confirmed';

type EditState = {
  visible: boolean;
  name: string;
  progress: string;
  remarks: string;
  nextAction: string;
};

const initialEditState: EditState = {
  visible: false,
  name: '',
  progress: '',
  remarks: '',
  nextAction: '',
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
      nextAction: company.nextAction ?? '',
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
      nextAction: editState.nextAction.trim() || undefined,
    });
    closeEdit();
  }, [
    closeEdit,
    companyId,
    editState.name,
    editState.progress,
    editState.remarks,
    editState.nextAction,
    updateCompany,
  ]);

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
        <PageHeader
          icon="building.2"
          title="企業"
          subtitle={`${company.name} の詳細`}
          iconColor={PRIMARY}
          iconBackgroundColor="rgba(37, 99, 235, 0.18)"
          style={styles.pageHeader}
          titleStyle={styles.pageHeaderTitle}
          subtitleStyle={styles.pageHeaderSubtitle}
        />
        <ThemedView style={styles.headerCard}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.companyName}>
              {company.name}
            </ThemedText>
            {(() => {
              const { bg, fg } = getStatusColors(company.progressStatus);
              return (
                <View style={[styles.statusBadge, { backgroundColor: bg }]}> 
                  <ThemedText style={[styles.statusBadgeLabel, { color: fg }]}>
                    {company.progressStatus}
                  </ThemedText>
                </View>
              );
            })()}
          </View>
          <Pressable style={styles.editButton} onPress={openEdit}>
            <MaterialIcons name="edit" size={18} color={PRIMARY} />
            <ThemedText style={styles.editButtonLabel}>情報を編集</ThemedText>
          </Pressable>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              次のアクション
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
            <View style={styles.nextActionCard}>
              <ScheduleChip iso={company.confirmedDate} status="confirmed" />
              {company.nextAction ? (
                <ThemedText style={styles.nextActionText}>{company.nextAction}</ThemedText>
              ) : (
                <ThemedText style={styles.placeholder}>次にやることは未登録です。</ThemedText>
              )}
            </View>
          ) : (
            <View style={styles.nextActionEmpty}>
              <ThemedText style={styles.placeholder}>確定済みの予定はありません。</ThemedText>
              {company.nextAction ? (
                <ThemedText style={styles.nextActionPending}>
                  次にやること: {company.nextAction}
                </ThemedText>
              ) : (
                <ThemedText style={styles.helperText}>
                  候補日を確定すると次の予定が表示されます。
                </ThemedText>
              )}
            </View>
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
      </ScrollView>

      <Modal transparent visible={editState.visible} animationType="slide">
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalCard, styles.formModal]}>
            <ThemedText type="title" style={styles.modalTitle}>
              情報を編集
            </ThemedText>
            <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
            <TextInput
              value={editState.name}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, name: text }))}
              style={styles.input}
            />
            <ThemedText style={styles.fieldLabel}>進捗</ThemedText>
            <TextInput
              placeholder="例：選考中／結果待ち／内定 など"
              value={editState.progress}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, progress: text }))}
              style={styles.input}
            />
            <ThemedText style={styles.fieldLabel}>メモ（任意）</ThemedText>
            <TextInput
              value={editState.remarks}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, remarks: text }))}
              multiline
              style={[styles.input, styles.multilineInput]}
            />
            <ThemedText style={styles.fieldLabel}>次にやること</ThemedText>
            <TextInput
              value={editState.nextAction}
              onChangeText={(text) => setEditState((prev) => ({ ...prev, nextAction: text }))}
              placeholder="例：一次面接の準備資料を仕上げる"
              style={styles.input}
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
  pageHeader: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  pageHeaderTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  pageHeaderSubtitle: {
    color: TEXT_MUTED,
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
  fieldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  chipStack: {
    gap: 12,
  },
  nextActionCard: {
    gap: 12,
  },
  nextActionText: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  nextActionEmpty: {
    gap: 6,
  },
  nextActionPending: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  helperText: {
    color: TEXT_MUTED,
    fontSize: 12,
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
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F1F5FF',
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
