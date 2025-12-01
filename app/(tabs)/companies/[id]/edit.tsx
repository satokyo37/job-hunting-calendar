import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressStatusPickerModal } from '@/components/ProgressStatusPickerModal';
import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import {
  PROGRESS_STATUS_ITEMS,
  ProgressStatusValue,
  isProgressStatusValue,
} from '@/constants/progressStatus';
import { useAppStore } from '@/store/useAppStore';

const {
  background: BACKGROUND,
  surface: SURFACE,
  surfaceSubtle: SURFACE_SUBTLE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  primary: PRIMARY,
  success: SUCCESS,
  danger: DANGER,
} = Palette;
const DEFAULT_PROGRESS_STATUS = PROGRESS_STATUS_ITEMS[0].value;

const formatTaskDueLabel = (iso: string) =>
  format(parseISO(iso), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", { locale: ja });

type PickerMode = 'candidate' | 'task';

export default function CompanyEditScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();

  const companies = useAppStore((state) => state.companies);
  const addCandidateDate = useAppStore((state) => state.addCandidateDate);
  const removeCandidateDate = useAppStore((state) => state.removeCandidateDate);
  const confirmCandidateDate = useAppStore((state) => state.confirmCandidateDate);
  const updateCompany = useAppStore((state) => state.updateCompany);
  const addTaskToCompany = useAppStore((state) => state.addTaskToCompany);
  const toggleTaskDone = useAppStore((state) => state.toggleTaskDone);
  const removeTaskFromCompany = useAppStore((state) => state.removeTaskFromCompany);

  const company = useMemo(
    () => companies.find((candidate) => candidate.id === companyId) ?? null,
    [companies, companyId],
  );

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string | undefined>();
  const [draftName, setDraftName] = useState('');
  const [draftProgress, setDraftProgress] = useState<ProgressStatusValue>(DEFAULT_PROGRESS_STATUS);
  const [draftRemarks, setDraftRemarks] = useState('');
  const [draftNextAction, setDraftNextAction] = useState('');
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const pendingNavigationActionRef = useRef<(() => void) | null>(null);

  const selectedProgressMeta = useMemo(
    () => PROGRESS_STATUS_ITEMS.find((item) => item.value === draftProgress),
    [draftProgress],
  );

  const syncDrafts = useCallback(() => {
    if (!company) {
      return;
    }
    setDraftName(company.name);
    setDraftProgress(
      isProgressStatusValue(company.progressStatus)
        ? company.progressStatus
        : DEFAULT_PROGRESS_STATUS,
    );
    setDraftRemarks(company.remarks ?? '');
    setDraftNextAction(company.nextAction ?? '');
    setTaskTitle('');
    setTaskDueDate(undefined);
    setPickerMode(null);
    setPickerVisible(false);
  }, [company]);

  useEffect(() => {
    syncDrafts();
  }, [syncDrafts]);

  const hasUnsavedDraft = useMemo(() => {
    if (!company) return false;
    const nameChanged = draftName.trim() !== company.name;
    const progressChanged = draftProgress !== company.progressStatus;
    const remarksChanged = (draftRemarks.trim() || '') !== (company.remarks ?? '');
    const nextActionChanged = (draftNextAction.trim() || '') !== (company.nextAction ?? '');
    const taskComposerChanged = taskTitle.trim().length > 0 || Boolean(taskDueDate);
    return (
      nameChanged || progressChanged || remarksChanged || nextActionChanged || taskComposerChanged
    );
  }, [company, draftName, draftNextAction, draftProgress, draftRemarks, taskDueDate, taskTitle]);

  if (!companyId || !company) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: '企業を編集' }} />
        <ThemedView style={[styles.container, styles.centered]}>
          <ThemedText type="defaultSemiBold">指定された企業が見つかりませんでした。</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const handlePickerOpen = useCallback((mode: PickerMode) => {
    setPickerMode(mode);
    setPickerVisible(true);
  }, []);

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setPickerMode(null);
  }, []);

  const handlePickerConfirm = useCallback(
    (iso: string) => {
      if (!companyId || !pickerMode) return;
      if (pickerMode === 'task') {
        setTaskDueDate(iso);
        handlePickerClose();
        return;
      }
      addCandidateDate(companyId, iso);
      handlePickerClose();
    },
    [addCandidateDate, companyId, handlePickerClose, pickerMode],
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'task' && taskDueDate) {
      return taskDueDate;
    }
    return undefined;
  }, [pickerMode, taskDueDate]);

  const pickerStatus: 'candidate' | 'task' = pickerMode ?? 'candidate';

  const handleClearConfirmed = useCallback(() => {
    if (!companyId) return;
    updateCompany(companyId, { confirmedDate: undefined });
  }, [companyId, updateCompany]);

  const handleTaskAdd = useCallback(() => {
    if (!companyId) return;
    const title = taskTitle.trim();
    if (!title) {
      Alert.alert('入力エラー', 'タスク名を入力してください。');
      return;
    }
    addTaskToCompany(companyId, { title, dueDate: taskDueDate });
    setTaskTitle('');
    setTaskDueDate(undefined);
  }, [addTaskToCompany, companyId, taskDueDate, taskTitle]);

  const handleTaskDueClear = useCallback(() => {
    setTaskDueDate(undefined);
  }, []);

  const handleTaskToggle = useCallback(
    (taskId: string) => {
      if (!companyId) return;
      toggleTaskDone(companyId, taskId);
    },
    [companyId, toggleTaskDone],
  );

  const handleTaskRemove = useCallback(
    (taskId: string) => {
      if (!companyId) return;
      removeTaskFromCompany(companyId, taskId);
    },
    [companyId, removeTaskFromCompany],
  );

  const handleSave = useCallback(() => {
    if (!companyId) return;
    const name = draftName.trim();
    if (!name) {
      Alert.alert('入力エラー', '企業名を入力してください。');
      return;
    }
    updateCompany(companyId, {
      name,
      progressStatus: draftProgress,
      remarks: draftRemarks.trim() || undefined,
      nextAction: draftNextAction.trim() || undefined,
    });
    router.back();
  }, [companyId, draftName, draftNextAction, draftProgress, draftRemarks, router, updateCompany]);

  const handleCancel = useCallback(() => {
    if (!hasUnsavedDraft) {
      router.back();
      return;
    }
    pendingNavigationActionRef.current = () => router.back();
    setDiscardDialogVisible(true);
  }, [hasUnsavedDraft, router]);

  const handleDiscardDialogClose = useCallback(() => {
    setDiscardDialogVisible(false);
    pendingNavigationActionRef.current = null;
  }, []);

  const handleDiscardConfirm = useCallback(() => {
    setDiscardDialogVisible(false);
    syncDrafts();
    const action = pendingNavigationActionRef.current;
    pendingNavigationActionRef.current = null;
    if (action) {
      action();
      return;
    }
    router.back();
  }, [router, syncDrafts]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (discardDialogVisible) {
          handleDiscardDialogClose();
          return true;
        }
        if (statusPickerVisible) {
          setStatusPickerVisible(false);
          return true;
        }
        if (pickerVisible) {
          handlePickerClose();
          return true;
        }
        if (!hasUnsavedDraft) {
          return false;
        }
        handleCancel();
        return true;
      });

      return () => subscription.remove();
    }, [
      discardDialogVisible,
      handleCancel,
      handleDiscardDialogClose,
      hasUnsavedDraft,
      pickerVisible,
      handlePickerClose,
      statusPickerVisible,
    ]),
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedDraft) {
        return;
      }

      e.preventDefault();
      pendingNavigationActionRef.current = () => navigation.dispatch(e.data.action);
      setDiscardDialogVisible(true);
    });

    return unsubscribe;
  }, [hasUnsavedDraft, navigation]);

  const canAddTask = taskTitle.trim().length > 0;

  const renderTaskRows = () => {
    if (company.tasks.length === 0) {
      return (
        <View style={{ alignItems: 'center', gap: 6 }}>
          <MaterialIcons name="check-circle-outline" size={20} color={TEXT_MUTED} />
          <ThemedText style={styles.placeholder}>現在登録されているタスクはありません</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.taskList}>
        {company.tasks.map((task) => {
          const icon = (
            <MaterialIcons
              name={task.isDone ? 'check-circle' : 'radio-button-unchecked'}
              size={20}
              color={task.isDone ? SUCCESS : PRIMARY}
            />
          );
          return (
            <View key={task.id} style={styles.taskRow}>
              <Pressable style={styles.taskToggle} onPress={() => handleTaskToggle(task.id)}>
                {icon}
              </Pressable>
              <View style={styles.taskBody}>
                <ThemedText style={[styles.taskTitle, task.isDone && styles.taskTitleDone]}>
                  {task.title}
                </ThemedText>
                {task.dueDate ? (
                  <ThemedText style={styles.taskDue}>
                    期限: {formatTaskDueLabel(task.dueDate)}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable style={styles.taskDelete} onPress={() => handleTaskRemove(task.id)}>
                <MaterialIcons name="delete-outline" size={18} color={TEXT_MUTED} />
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  };

  const editingContent = (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formCard}>
        <View style={styles.sectionGroup}>
          <ThemedText style={styles.formHeading}>基本情報</ThemedText>
          <View style={styles.formSection}>
            <View style={styles.inputBlock}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
                <ThemedText style={styles.requiredTag}>必須</ThemedText>
              </View>
              <TextInput style={styles.input} value={draftName} onChangeText={setDraftName} />
            </View>
            <View style={styles.inputBlock}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.fieldLabel}>進捗ステータス</ThemedText>
                <ThemedText style={styles.requiredTag}>必須</ThemedText>
              </View>
              <Pressable
                style={[styles.input, styles.selectInput]}
                onPress={() => setStatusPickerVisible(true)}
              >
                {selectedProgressMeta ? (
                  <View style={styles.selectValueRow}>
                    <MaterialIcons
                      name={selectedProgressMeta.icon as any}
                      size={18}
                      color={selectedProgressMeta.accent}
                    />
                    <View style={styles.selectTexts}>
                      <ThemedText style={styles.selectValue}>
                        {selectedProgressMeta.value}
                      </ThemedText>
                      <ThemedText style={styles.selectDescription}>
                        {selectedProgressMeta.description}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={styles.selectPlaceholder}>選択してください</ThemedText>
                )}
                <MaterialIcons name="expand-more" size={22} color={TEXT_MUTED} />
              </Pressable>
            </View>
            <View style={styles.inputBlock}>
              <ThemedText style={styles.fieldLabel}>備考</ThemedText>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={draftRemarks}
                onChangeText={setDraftRemarks}
                multiline
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <ThemedText style={styles.formHeading}>予定</ThemedText>
          <View style={[styles.formSection, styles.scheduleSection]}>
            <View style={styles.inputBlock}>
              <ThemedText style={styles.fieldLabel}>タイトル</ThemedText>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={draftNextAction}
                onChangeText={setDraftNextAction}
                multiline
              />
            </View>
            <View style={styles.scheduleActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => handlePickerOpen('candidate')}
              >
                <MaterialIcons name="event" size={16} color={PRIMARY} />
                <ThemedText style={styles.secondaryButtonLabel}>候補日を追加</ThemedText>
              </Pressable>
            </View>
            <View style={styles.scheduleSummaryCard}>
              {company.confirmedDate ? (
                <View style={styles.confirmedBlock}>
                  <ThemedText style={styles.formCaption}>確定日</ThemedText>
                  <ScheduleChip
                    iso={company.confirmedDate}
                    status="confirmed"
                    title={draftNextAction.trim() || undefined}
                    actionsAlign="right"
                    actions={[
                      {
                        key: 'clear',
                        label: '削除',
                        icon: 'delete',
                        color: DANGER,
                        backgroundColor: 'rgba(248, 113, 113, 0.18)',
                        onPress: handleClearConfirmed,
                      },
                    ]}
                  />
                </View>
              ) : null}

              {company.candidateDates.length > 0 ? (
                <View
                  style={[
                    styles.candidateBlock,
                    company.confirmedDate && styles.scheduleSummaryDivider,
                  ]}
                >
                  <ThemedText style={styles.formCaption}>候補日</ThemedText>
                  <View style={styles.chipColumn}>
                    {company.candidateDates.map((candidate) => (
                      <ScheduleChip
                        key={candidate}
                        iso={candidate}
                        status="candidate"
                        title={draftNextAction.trim() || undefined}
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
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <ThemedText style={styles.formHeading}>タスク</ThemedText>
          <View style={[styles.formSection, styles.taskSection]}>
            <View style={styles.taskComposer}>
              <TextInput
                style={[styles.input, styles.taskInput]}
                value={taskTitle}
                placeholder="例: ES提出"
                onChangeText={setTaskTitle}
              />
            </View>
            {taskDueDate ? (
              <View style={styles.taskDueBadge}>
                <MaterialIcons name="schedule" size={14} color={PRIMARY} />
                <ThemedText style={styles.taskDueLabel}>
                  {formatTaskDueLabel(taskDueDate)}
                </ThemedText>
                <Pressable onPress={handleTaskDueClear} style={styles.taskDueRemove}>
                  <MaterialIcons name="close" size={12} color={TEXT_MUTED} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.taskActionsRow}>
              <Pressable
                style={[styles.secondaryButton, styles.taskDueButton]}
                onPress={() => handlePickerOpen('task')}
              >
                <MaterialIcons name="event" size={16} color={PRIMARY} />
                <ThemedText style={styles.secondaryButtonLabel}>
                  {taskDueDate ? '期限を変更' : '期限を設定'}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryButton,
                  styles.taskAddButton,
                  canAddTask && styles.taskAddButtonActive,
                ]}
                disabled={!canAddTask}
                onPress={handleTaskAdd}
              >
                <MaterialIcons name="add" size={16} color={canAddTask ? '#FFFFFF' : TEXT_MUTED} />
                <ThemedText
                  style={[styles.taskAddLabel, !canAddTask && styles.taskAddDisabledLabel]}
                >
                  追加
                </ThemedText>
              </Pressable>
            </View>
            {renderTaskRows()}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: '編集',
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButtonGhost} hitSlop={8}>
              <ThemedText style={styles.headerButtonGhostLabel}>保存</ThemedText>
            </Pressable>
          ),
        }}
      />
      {editingContent}
      <Modal
        visible={discardDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={handleDiscardDialogClose}
      >
        <View style={styles.discardModalOverlay}>
          <Pressable style={styles.discardModalBackdrop} onPress={handleDiscardDialogClose} />
          <ThemedView style={styles.discardModalCard}>
            <View style={styles.discardModalBody}>
              <View style={styles.discardModalHeading}>
                <View style={styles.discardModalIcon}>
                  <MaterialIcons name="warning-amber" size={26} color={DANGER} />
                </View>
                <ThemedText style={styles.discardModalTitle}>変更を破棄しますか？</ThemedText>
              </View>
              <ThemedText style={styles.discardModalMessage}>
                保存していない変更があります。破棄すると元には戻せません。
              </ThemedText>
            </View>
            <View style={styles.discardModalActions}>
              <Pressable
                onPress={handleDiscardDialogClose}
                style={({ pressed }) => [
                  styles.discardModalButton,
                  styles.discardModalSecondary,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ThemedText style={styles.discardModalSecondaryLabel} numberOfLines={1}>
                  続ける
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleDiscardConfirm}
                style={({ pressed }) => [
                  styles.discardModalButton,
                  styles.discardModalDanger,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <ThemedText style={styles.discardModalDangerLabel} numberOfLines={1}>
                  破棄する
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
      <SchedulePickerModal
        visible={pickerVisible && Boolean(pickerMode)}
        status={pickerStatus}
        initialValue={pickerInitialValue}
        onCancel={handlePickerClose}
        onConfirm={handlePickerConfirm}
      />
      <ProgressStatusPickerModal
        visible={statusPickerVisible}
        selected={draftProgress}
        onClose={() => setStatusPickerVisible(false)}
        onSelect={setDraftProgress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  candidateBlock: {
    gap: 10,
  },
  centered: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: 24,
  },
  chipColumn: {
    gap: 10,
  },
  confirmedBlock: {
    gap: 10,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  discardModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  discardModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  discardModalBody: {
    gap: 12,
  },
  discardModalButton: {
    flex: 1,
    minWidth: 120,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  discardModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  discardModalDanger: {
    borderColor: DANGER,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  discardModalDangerLabel: {
    color: DANGER,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 60,
  },
  discardModalHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discardModalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  discardModalMessage: {
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  discardModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  discardModalSecondary: {
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  discardModalSecondaryLabel: {
    color: TEXT_MUTED,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 60,
  },
  discardModalTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  fieldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  formCaption: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    gap: 24,
  },
  formHeading: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: '700',
  },
  formSection: {
    gap: 16,
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
  },
  headerButtonFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  headerButtonFilledLabel: { color: '#FFFFFF', fontWeight: '700' },
  headerButtonGhost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerButtonGhostLabel: { color: PRIMARY, fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TEXT_PRIMARY,
    fontWeight: '500',
  },
  inputBlock: {
    width: '100%',
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  requiredTag: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scheduleSection: {
    gap: 20,
  },
  scheduleSummaryCard: {
    gap: 16,
  },
  scheduleSummaryDivider: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
    paddingBottom: 120,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
  },
  secondaryButtonDisabled: {
    opacity: 0.4,
  },
  secondaryButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  sectionGroup: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  selectDescription: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectPlaceholder: {
    color: TEXT_MUTED,
  },
  selectTexts: {
    gap: 4,
  },
  selectValue: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  selectValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskAddButton: {
    flex: 1,
  },
  taskAddButtonActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  taskAddDisabledLabel: {
    color: TEXT_MUTED,
  },
  taskAddLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  taskBody: { flex: 1, gap: 4 },
  taskComposer: {
    gap: 8,
  },
  taskDelete: { padding: 4 },
  taskDue: { color: TEXT_MUTED, fontSize: 12 },
  taskDueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  taskDueButton: {
    flex: 1,
  },
  taskDueLabel: { color: TEXT_MUTED, fontSize: 12 },
  taskDueRemove: { padding: 2 },
  taskInput: {
    fontSize: 14,
  },
  taskList: {
    gap: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  taskSection: {
    gap: 16,
  },
  taskTitle: { color: TEXT_PRIMARY, fontWeight: '600' },
  taskTitleDone: { opacity: 0.5, textDecorationLine: 'line-through' },
  taskToggle: { width: 28, alignItems: 'center' },
});
