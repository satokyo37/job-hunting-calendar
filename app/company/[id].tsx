import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NavigationAction } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ProgressStatusPickerModal } from '@/components/ProgressStatusPickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { PROGRESS_STATUS_ITEMS, ProgressStatusValue, isProgressStatusValue } from '@/constants/progressStatus';
import { NOTO_SANS_JP } from '@/constants/Typography';
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
  format(parseISO(iso), 'M月d日(EEE) HH:mm', { locale: ja });

type PickerMode = 'candidate' | 'task';

export default function CompanyDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companyId = Array.isArray(params.id) ? params.id[0] : params.id;
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
    [companies, companyId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState<string | undefined>();
  const [draftName, setDraftName] = useState('');
  const [draftProgress, setDraftProgress] = useState<ProgressStatusValue>(DEFAULT_PROGRESS_STATUS);
  const [draftRemarks, setDraftRemarks] = useState('');
  const [draftNextAction, setDraftNextAction] = useState('');
  const [unsavedWarningVisible, setUnsavedWarningVisible] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<NavigationAction | null>(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  const selectedProgressMeta = useMemo(
    () => PROGRESS_STATUS_ITEMS.find((item) => item.value === draftProgress),
    [draftProgress]
  );

  const resetEditingControls = useCallback(() => {
    setTaskTitle('');
    setTaskDueDate(undefined);
    setPickerMode(null);
    setPickerVisible(false);
  }, []);

  const syncDrafts = useCallback(() => {
    if (!company) {
      return;
    }
    setDraftName(company.name);
    setDraftProgress(
      isProgressStatusValue(company.progressStatus) ? company.progressStatus : DEFAULT_PROGRESS_STATUS
    );
    setDraftRemarks(company.remarks ?? '');
    setDraftNextAction(company.nextAction ?? '');
  }, [company]);

  useEffect(() => {
    syncDrafts();
  }, [syncDrafts]);

  useEffect(() => {
    if (!isEditing) {
      setStatusPickerVisible(false);
    }
  }, [isEditing]);

  const handleEnterEditingMode = useCallback(() => {
    if (!company) {
      return;
    }
    syncDrafts();
    resetEditingControls();
    setIsEditing(true);
  }, [company, resetEditingControls, syncDrafts]);

  const handleExitEditingMode = useCallback(() => {
    if (!companyId || !company) {
      return;
    }
    const name = draftName.trim();
    const progress = draftProgress;
    if (!name || !progress) {
      Alert.alert('入力エラー', '会社名と進捗ステータスを入力してください。');
      return;
    }
    updateCompany(companyId, {
      name,
      progressStatus: progress,
      remarks: draftRemarks.trim() || undefined,
      nextAction: draftNextAction.trim() || undefined,
    });
    setIsEditing(false);
    resetEditingControls();
  }, [
    company,
    companyId,
    draftName,
    draftProgress,
    draftRemarks,
    draftNextAction,
    resetEditingControls,
    updateCompany,
  ]);

  const hasConfirmedSchedule = Boolean(company?.confirmedDate);
  const hasTasks = (company?.tasks.length ?? 0) > 0;
  const hasSchedulePreview = hasConfirmedSchedule || (company?.candidateDates.length ?? 0) > 0;

  const canAddTask = isEditing && taskTitle.trim().length > 0;
  const taskDueLabel = taskDueDate ? formatTaskDueLabel(taskDueDate) : '期限未設定';

  const hasUnsavedDraft = useMemo(() => {
    if (!company) {
      return false;
    }
    const nameChanged = draftName.trim() !== company.name;
    const progressChanged = draftProgress !== company.progressStatus;
    const remarksChanged = (draftRemarks.trim() || '') !== (company.remarks ?? '');
    const nextActionChanged = (draftNextAction.trim() || '') !== (company.nextAction ?? '');
    const taskComposerChanged = taskTitle.trim().length > 0 || Boolean(taskDueDate);
    return nameChanged || progressChanged || remarksChanged || nextActionChanged || taskComposerChanged;
  }, [
    company,
    draftName,
    draftNextAction,
    draftProgress,
    draftRemarks,
    taskDueDate,
    taskTitle,
  ]);

  const handlePickerOpen = useCallback(
    (mode: PickerMode) => {
      if (!isEditing) return;
      setPickerMode(mode);
      setPickerVisible(true);
    },
    [isEditing]
  );

  const handlePickerClose = useCallback(() => {
    setPickerVisible(false);
    setPickerMode(null);
  }, []);

  const handleStatusPickerOpen = useCallback(() => {
    if (!isEditing) return;
    setStatusPickerVisible(true);
  }, [isEditing]);

  const handleStatusPickerClose = useCallback(() => {
    setStatusPickerVisible(false);
  }, []);

  const handleStatusSelected = useCallback((value: ProgressStatusValue) => {
    setDraftProgress(value);
  }, []);

  const handlePickerConfirm = useCallback(
    (iso: string) => {
      if (!pickerMode) {
        return;
      }
      if (pickerMode === 'task') {
        if (!isEditing) return;
        setTaskDueDate(iso);
        handlePickerClose();
        return;
      }
      if (!companyId || !isEditing) {
        return;
      }
      addCandidateDate(companyId, iso);
      handlePickerClose();
    },
    [addCandidateDate, companyId, handlePickerClose, isEditing, pickerMode]
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'task' && taskDueDate) {
      return taskDueDate;
    }
    return undefined;
  }, [pickerMode, taskDueDate]);

  const pickerStatus: 'candidate' | 'task' = pickerMode ?? 'candidate';

  const handleClearConfirmed = useCallback(() => {
    if (!companyId || !isEditing) {
      return;
    }
    updateCompany(companyId, { confirmedDate: undefined });
  }, [companyId, isEditing, updateCompany]);

  const handleTaskAdd = useCallback(() => {
    if (!companyId || !isEditing) {
      return;
    }
    const title = taskTitle.trim();
    if (!title) {
      Alert.alert('入力エラー', 'タスク名を入力してください。');
      return;
    }
    addTaskToCompany(companyId, { title, dueDate: taskDueDate });
    setTaskTitle('');
    setTaskDueDate(undefined);
  }, [addTaskToCompany, companyId, isEditing, taskDueDate, taskTitle]);

  const handleTaskDueClear = useCallback(() => {
    if (!isEditing) return;
    setTaskDueDate(undefined);
  }, [isEditing]);

  const handleTaskToggle = useCallback(
    (taskId: string) => {
      if (!companyId || !isEditing) {
        return;
      }
      toggleTaskDone(companyId, taskId);
    },
    [companyId, isEditing, toggleTaskDone]
  );

  const handleTaskRemove = useCallback(
    (taskId: string) => {
      if (!companyId || !isEditing) {
        return;
      }
      removeTaskFromCompany(companyId, taskId);
    },
    [companyId, isEditing, removeTaskFromCompany]
  );

  const handleDiscardAndLeave = useCallback(() => {
    if (pendingNavAction) {
      setIsEditing(false);
      resetEditingControls();
      syncDrafts();
      navigation.dispatch(pendingNavAction);
    }
    setPendingNavAction(null);
    setUnsavedWarningVisible(false);
  }, [navigation, pendingNavAction, resetEditingControls, syncDrafts]);

  const handleStayEditing = useCallback(() => {
    setPendingNavAction(null);
    setUnsavedWarningVisible(false);
  }, []);

  useEffect(() => {
    const subscription = navigation.addListener('beforeRemove', (event) => {
      if (!isEditing || !hasUnsavedDraft) {
        return;
      }
      event.preventDefault();
      setPendingNavAction(event.data.action);
      setUnsavedWarningVisible(true);
    });

    return subscription;
  }, [hasUnsavedDraft, isEditing, navigation]);

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

  const renderSchedulePreview = () => {
    if (!hasSchedulePreview) {
      return null;
    }
    return (
      <View style={styles.scheduleSummaryCard}>
        {company.confirmedDate ? (
          <View style={styles.confirmedBlock}>
            <ThemedText style={styles.formCaption}>確定済みの予定</ThemedText>
            <ScheduleChip
              iso={company.confirmedDate}
              status="confirmed"
              actionsAlign="right"
              actions={
                isEditing
                  ? [
                      {
                        key: 'clear',
                        label: '削除',
                        icon: 'delete',
                        color: DANGER,
                        backgroundColor: 'rgba(248, 113, 113, 0.18)',
                        onPress: handleClearConfirmed,
                      },
                    ]
                  : undefined
              }
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
                  actions={
                    isEditing
                      ? [
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
                        ]
                      : undefined
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderTaskRows = (readonly: boolean) => {
    if (!hasTasks) {
      return <ThemedText style={styles.placeholder}>現在登録されているタスクはありません</ThemedText>;
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
              {readonly ? (
                <View style={[styles.taskToggle, styles.readOnlyControl]}>{icon}</View>
              ) : (
                <Pressable style={styles.taskToggle} onPress={() => handleTaskToggle(task.id)}>
                  {icon}
                </Pressable>
              )}
              <View style={styles.taskBody}>
                <ThemedText style={[styles.taskTitle, task.isDone && styles.taskTitleDone]}>
                  {task.title}
                </ThemedText>
                {task.dueDate ? (
                  <ThemedText style={styles.taskDue}>期限: {formatTaskDueLabel(task.dueDate)}</ThemedText>
                ) : null}
              </View>
              {readonly ? null : (
                <Pressable style={styles.taskDelete} onPress={() => handleTaskRemove(task.id)}>
                  <MaterialIcons name="delete-outline" size={18} color={TEXT_MUTED} />
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const readOnlyContent = (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>基本情報</ThemedText>
        <View style={styles.readOnlyGroup}>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={company.name}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.fieldLabel}>進捗ステータス</ThemedText>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={company.progressStatus}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
          <View style={styles.readOnlyField}>
            <ThemedText style={styles.fieldLabel}>メモ</ThemedText>
            <TextInput
              style={[styles.input, styles.multilineInput, styles.readOnlyInput]}
              value={company.remarks ?? ''}
              editable={false}
              selectTextOnFocus={false}
              multiline
              scrollEnabled={false}
            />
          </View>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>日程調整</ThemedText>
        <View style={styles.readOnlyScheduleSection}>
          {hasSchedulePreview ? (
            renderSchedulePreview()
          ) : (
            <ThemedText style={styles.placeholder}>現在調整中の日程はありません</ThemedText>
          )}
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            タスク
          </ThemedText>
        </View>
        {renderTaskRows(true)}
      </ThemedView>
    </ScrollView>
  );

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
                onPress={handleStatusPickerOpen}
              >
                {selectedProgressMeta ? (
                  <View style={styles.selectContent}>
                    <View
                      style={[
                        styles.selectIcon,
                        {
                          backgroundColor: selectedProgressMeta.background,
                          borderColor: selectedProgressMeta.border,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={selectedProgressMeta.icon as any}
                        size={18}
                        color={selectedProgressMeta.accent}
                      />
                    </View>
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
              <ThemedText style={styles.fieldLabel}>メモ</ThemedText>
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
          <ThemedText style={styles.formHeading}>スケジュール</ThemedText>
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
                style={[
                  styles.secondaryButton,
                  hasConfirmedSchedule && styles.secondaryButtonDisabled,
                ]}
                onPress={() => {
                  if (hasConfirmedSchedule) return;
                  handlePickerOpen('candidate');
                }}
              >
                <MaterialIcons name="event" size={16} color={PRIMARY} />
                <ThemedText style={styles.secondaryButtonLabel}>候補日を追加</ThemedText>
              </Pressable>
            </View>
            {renderSchedulePreview()}
          </View>
        </View>

        <View style={styles.sectionGroup}>
          <ThemedText style={styles.formHeading}>タスク</ThemedText>
          <View style={[styles.formSection, styles.taskSection]}>
            <View style={styles.taskComposer}>
              <TextInput
                style={[styles.input, styles.taskInput]}
                value={taskTitle}
                placeholder="例:ES提出"
                onChangeText={setTaskTitle}
              />
            </View>
            {taskDueDate ? (
              <View style={styles.taskDueBadge}>
                <MaterialIcons name="schedule" size={14} color={PRIMARY} />
                <ThemedText style={styles.taskDueLabel}>{taskDueLabel}</ThemedText>
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
                  {taskDueDate ? '締切を変更' : '締切を設定'}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.secondaryButton,
                  styles.taskAddButton,
                  !canAddTask && styles.secondaryButtonDisabled,
                ]}
                onPress={handleTaskAdd}
                disabled={!canAddTask}
              >
                <MaterialIcons name="add" size={16} color={PRIMARY} />
                <ThemedText style={styles.secondaryButtonLabel}>追加</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            タスク一覧
          </ThemedText>
        </View>
        {renderTaskRows(false)}
      </ThemedView>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: '企業詳細',
          headerRight: () => (
            <Pressable onPress={isEditing ? handleExitEditingMode : handleEnterEditingMode}>
              <ThemedText style={styles.headerEditLink}>
                {isEditing ? '完了' : '編集'}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      {isEditing ? editingContent : readOnlyContent}

      {isEditing ? (
        <SchedulePickerModal
          visible={pickerVisible && Boolean(pickerMode)}
          status={pickerStatus}
          initialValue={pickerInitialValue}
          onCancel={handlePickerClose}
          onConfirm={handlePickerConfirm}
        />
      ) : null}

      {isEditing ? (
        <ProgressStatusPickerModal
          visible={statusPickerVisible}
          selected={draftProgress}
          onClose={handleStatusPickerClose}
          onSelect={handleStatusSelected}
        />
      ) : null}

      {unsavedWarningVisible ? (
        <Modal visible transparent animationType="fade" onRequestClose={handleStayEditing}>
          <Pressable style={styles.modalOverlay} onPress={handleStayEditing}>
            <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
              <ThemedText type="title" style={styles.modalTitle}>
                編集内容が保存されていません
              </ThemedText>
              <ThemedText style={styles.modalBody}>
                戻ると編集中の内容は破棄されますが、よろしいですか？
              </ThemedText>
              <View style={styles.modalActions}>
                <Pressable style={styles.modalActionButton} onPress={handleStayEditing}>
                  <ThemedText style={styles.modalActionLabel}>編集を続ける</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalActionButton, styles.modalActionPrimary]}
                  onPress={handleDiscardAndLeave}
                >
                  <ThemedText style={[styles.modalActionLabel, styles.modalActionPrimaryLabel]}>
                    破棄して戻る
                  </ThemedText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
  headerEditLink: {
    color: PRIMARY,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
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
    fontSize: 18,
    letterSpacing: 0.2,
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  fieldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  requiredTag: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '600',
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
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontSize: 14,
    fontFamily: NOTO_SANS_JP.semibold,
    backgroundColor: '#F1F5FF',
    color: TEXT_PRIMARY,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  selectTexts: {
    flex: 1,
  },
  selectValue: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  selectDescription: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  selectPlaceholder: {
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  readOnlyGroup: {
    marginTop: 8,
    gap: 12,
  },
  readOnlyScheduleSection: {
    gap: 16,
  },
  readOnlyField: {
    gap: 6,
  },
  readOnlyInput: {
    color: TEXT_MUTED,
  },
  readOnlyControl: {
    opacity: 0.4,
  },
  formCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 24,
  },
  sectionGroup: {
    gap: 8,
  },
  formHeading: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  formSection: {
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  scheduleSection: {
    gap: 14,
  },
  taskSection: {
    gap: 14,
  },
  taskInlineSection: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    gap: 14,
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  scheduleSummaryCard: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: 16,
    gap: 16,
  },
  scheduleSummaryDivider: {
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  confirmedBlock: {
    gap: 8,
  },
  candidateBlock: {
    gap: 12,
  },
  formCaption: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  chipColumn: {
    gap: 12,
  },
  taskComposer: {
    width: '100%',
  },
  taskInput: {
    flex: 1,
  },
  taskActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  taskDueButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  taskAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  taskDueBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  taskDueLabel: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 12,
  },
  taskDueRemove: {
    padding: 2,
  },
  taskList: {
    gap: 12,
    marginBottom: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  taskToggle: {
    padding: 4,
  },
  taskBody: {
    flex: 1,
    gap: 4,
  },
  taskTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  taskTitleDone: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  taskDue: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  taskDelete: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: SURFACE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    gap: 18,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalBody: {
    color: TEXT_MUTED,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalActionButton: {
    minWidth: 140,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    backgroundColor: '#F8FAFF',
    alignItems: 'center',
  },
  modalActionPrimary: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  modalActionLabel: {
    color: TEXT_PRIMARY,
    fontFamily: NOTO_SANS_JP.semibold,
  },
  modalActionPrimaryLabel: {
    color: '#FFFFFF',
  },
});


