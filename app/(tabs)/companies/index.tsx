import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/PageHeader';
import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { NOTO_SANS_JP } from '@/constants/Typography';
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

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), "yyyy'年'MM'月'dd'日'(EEE)HH:mm", { locale: ja });

const formatTaskDueLabel = (iso: string) => format(parseISO(iso), "M月d日 HH:mm", { locale: ja });

type PickerMode = 'candidate' | 'task';

export default function CompaniesScreen() {
  const companies = useAppStore((state) => state.companies);
  const createCompany = useAppStore((state) => state.createCompany);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProgress, setFormProgress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formNextAction, setFormNextAction] = useState('');
  const [formTasks, setFormTasks] = useState<{ title: string; dueDate?: string }[]>([]);
  const [formTaskDraft, setFormTaskDraft] = useState('');
  const [formTaskDue, setFormTaskDue] = useState<string | undefined>();
  const [formCandidates, setFormCandidates] = useState<string[]>([]);
  const [formConfirmedDate, setFormConfirmedDate] = useState<string | undefined>();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormProgress('');
    setFormNotes('');
    setFormNextAction('');
    setFormTaskDraft('');
    setFormTasks([]);
    setFormTaskDue(undefined);
    setFormCandidates([]);
    setFormConfirmedDate(undefined);
  }, []);

  const openCreateModal = useCallback(() => {
    setCreateModalVisible(true);
  }, []);

  const handleCancelCreate = useCallback(() => {
    const hasChanges =
      formName.trim() ||
      formProgress.trim() ||
      formNotes.trim() ||
      formNextAction.trim() ||
      formTaskDraft.trim() ||
      formTaskDue ||
      formTasks.length > 0 ||
      formCandidates.length > 0 ||
      formConfirmedDate;
    if (hasChanges) {
      Alert.alert('入力内容を破棄しますか？', 'キャンセルすると入力中の内容はすべて削除されます。', [
        { text: '続ける', style: 'cancel' },
        {
          text: '破棄する',
          style: 'destructive',
          onPress: () => {
            resetForm();
            setCreateModalVisible(false);
          },
        },
      ]);
      return;
    }
    setCreateModalVisible(false);
  }, [
    formCandidates.length,
    formConfirmedDate,
    formName,
    formNotes,
    formNextAction,
    formTaskDraft,
    formTaskDue,
    formTasks.length,
    formProgress,
    resetForm,
  ]);

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
      if (!pickerMode) return;
      if (pickerMode === 'candidate') {
        setFormCandidates((prev) => Array.from(new Set([...prev, iso])).sort());
      } else if (pickerMode === 'task') {
        setFormTaskDue(iso);
      }
      handlePickerClose();
    },
    [handlePickerClose, pickerMode]
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'task' && formTaskDue) return formTaskDue;
    return undefined;
  }, [pickerMode, formTaskDue]);

  const handleRemoveCandidate = useCallback((iso: string) => {
    setFormCandidates((prev) => prev.filter((date) => date !== iso));
  }, []);

  const handlePromoteCandidate = useCallback((iso: string) => {
    setFormConfirmedDate(iso);
    setFormCandidates((prev) => prev.filter((date) => date !== iso));
  }, []);

  const handleClearConfirmed = useCallback(() => {
    setFormConfirmedDate(undefined);
  }, []);

  const hasSchedulePreview = formCandidates.length > 0 || Boolean(formConfirmedDate);
  const canAddTask = formTaskDraft.trim().length > 0;

  const handleAddTask = useCallback(() => {
    const title = formTaskDraft.trim();
    if (!title) return;
    setFormTasks((prev) => [...prev, { title, dueDate: formTaskDue }]);
    setFormTaskDraft('');
    setFormTaskDue(undefined);
  }, [formTaskDraft, formTaskDue]);

  const handleRemoveTask = useCallback((index: number) => {
    setFormTasks((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleClearTaskDue = useCallback(() => {
    setFormTaskDue(undefined);
  }, []);

  const handleCreateCompany = useCallback(() => {
    const name = formName.trim();
    const progress = formProgress.trim();
    if (!name || !progress) {
      Alert.alert('入力エラー', '企業名と進捗ステータスを入力してください。');
      return;
    }

    const tasksPayload = formTasks
      .map((task) => ({
        title: task.title.trim(),
        dueDate: task.dueDate,
        isDone: false,
      }))
      .filter((task) => task.title.length > 0);

    createCompany({
      name,
      progressStatus: progress,
      tasks: tasksPayload,
      candidateDates: formCandidates,
      confirmedDate: formConfirmedDate,
      remarks: formNotes.trim() || undefined,
      nextAction: formNextAction.trim() || undefined,
    });

    resetForm();
    setCreateModalVisible(false);
  }, [
    createCompany,
    formCandidates,
    formConfirmedDate,
    formName,
    formNotes,
    formNextAction,
    formProgress,
    formTasks,
    setCreateModalVisible,
    resetForm,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PageHeader
          icon="building.2"
          title="企業管理"
          subtitle={`${companies.length}社を管理中`}
          iconColor={PRIMARY}
          iconBackgroundColor="rgba(37, 99, 235, 0.18)"
          style={styles.pageHeader}
          titleStyle={styles.pageHeaderTitle}
          subtitleStyle={styles.pageHeaderSubtitle}
          rightSlot={
            <Pressable style={styles.primaryButton} onPress={openCreateModal}>
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
              <ThemedText style={styles.primaryButtonLabel}>企業を追加</ThemedText>
            </Pressable>
          }
        />
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={companies}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ThemedView style={styles.emptyList}>
              <MaterialIcons name="business" size={36} color={PRIMARY} />
              <ThemedText style={styles.emptyTitle}>まだ企業が登録されていません</ThemedText>
              <ThemedText style={styles.emptyCopy}>
                「企業を追加」から候補日や進捗を記録しましょう
              </ThemedText>
            </ThemedView>
          }
          ListHeaderComponent={null}
          renderItem={({ item }) => {
            const hasConfirmed = Boolean(item.confirmedDate);
            const candidateCount = item.candidateDates.length;
            return (
              <Link href={`/(tabs)/companies/${item.id}`} asChild>
                <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                  <View style={styles.cardSurface}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.companyName}>
                        {item.name}
                      </ThemedText>
                      <View style={styles.statusBadge}>
                        <ThemedText style={styles.statusBadgeLabel}>
                          {item.progressStatus}
                        </ThemedText>
                      </View>
                    </View>

                    {hasConfirmed ? (
                      <View style={styles.cardMetaRow}>
                        <View style={styles.metaColumn}>
                          <ThemedText style={styles.metaLabel}>確定日時</ThemedText>
                          <ThemedText style={styles.metaValue} numberOfLines={2}>
                            {formatDisplayDate(item.confirmedDate!)}
                          </ThemedText>
                          {item.nextAction ? (
                            <ThemedText style={styles.metaAction} numberOfLines={2}>
                              {item.nextAction}
                            </ThemedText>
                          ) : null}
                        </View>
                        <View style={styles.metaPills}>
                          <View style={[styles.metaPill, styles.metaPillConfirmed]}>
                            <MaterialIcons name="event-available" size={14} color={SUCCESS} />
                            <ThemedText style={[styles.metaPillLabel, styles.metaConfirmedLabel]}>
                              確定あり
                            </ThemedText>
                          </View>
                          {candidateCount > 0 ? (
                            <View style={styles.metaPill}>
                              <MaterialIcons name="event" size={14} color={PRIMARY} />
                              <ThemedText style={[styles.metaPillLabel, styles.metaCandidateLabel]}>
                                候補 {candidateCount}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ) : candidateCount > 0 ? (
                      <View style={styles.cardCandidateRow}>
                        <MaterialIcons name="event" size={16} color={PRIMARY} />
                        <ThemedText style={styles.cardCandidateLabel}>
                          候補日 {candidateCount} 件登録があります
                        </ThemedText>
                      </View>
                    ) : null}

                    {item.remarks ? (
                      <ThemedText style={styles.noteSnippet} numberOfLines={2}>
                        {item.remarks}
                      </ThemedText>
                    ) : null}
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />

        <Modal visible={createModalVisible} animationType="slide">
          <View style={styles.createModalOverlay}>
            <ThemedView style={styles.createModalCard}>
              <ScrollView contentContainerStyle={styles.createModalContent} keyboardShouldPersistTaps="handled">
                <View style={styles.formHeader}>
                  <ThemedText style={styles.formTitle}>企業を追加</ThemedText>
                </View>

                <View style={styles.sectionGroup}>
                  <ThemedText style={styles.formHeading}>基本情報</ThemedText>
                  <View style={styles.formSection}>
                    <View style={styles.inputBlock}>
                      <View style={styles.labelRow}>
                        <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
                        <ThemedText style={styles.requiredTag}>必須</ThemedText>
                      </View>
                      <TextInput style={styles.input} value={formName} onChangeText={setFormName} />
                    </View>
                    <View style={styles.inputBlock}>
                      <View style={styles.labelRow}>
                        <ThemedText style={styles.fieldLabel}>進捗ステータス</ThemedText>
                        <ThemedText style={styles.requiredTag}>必須</ThemedText>
                      </View>
                      <TextInput
                        style={styles.input}
                        value={formProgress}
                        placeholder="例: 書類選考/一次選考 など"
                        onChangeText={setFormProgress}
                      />
                    </View>
                    <View style={styles.inputBlock}>
                      <ThemedText style={styles.fieldLabel}>メモ</ThemedText>
                      <TextInput
                        style={[styles.input, styles.multilineInput]}
                        value={formNotes}
                        onChangeText={setFormNotes}
                        multiline
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.sectionGroup}>
                  <ThemedText style={styles.formHeading}>スケジュール</ThemedText>
                  <View style={[styles.formSection, styles.scheduleSection]}>
                    <View style={styles.inputBlock}>
                      <View style={styles.labelRow}>
                        <ThemedText style={styles.fieldLabel}>日程調整</ThemedText>
                      </View>
                    <TextInput
                      style={styles.input}
                      value={formNextAction}
                      onChangeText={setFormNextAction}
                      placeholder="例: 一次面接"
                    />
                  </View>
                  <View style={styles.scheduleActions}>
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        formConfirmedDate && styles.secondaryButtonDisabled,
                      ]}
                      disabled={Boolean(formConfirmedDate)}
                      onPress={() => {
                        if (formConfirmedDate) return;
                        handlePickerOpen('candidate');
                      }}
                    >
                      <MaterialIcons name="event" size={16} color={PRIMARY} />
                      <ThemedText style={styles.secondaryButtonLabel}>候補日を追加</ThemedText>
                    </Pressable>
                  </View>

                    {hasSchedulePreview ? (
                      <View style={styles.scheduleSummaryCard}>
                        {formConfirmedDate ? (
                          <View style={styles.confirmedBlock}>
                            <ThemedText style={styles.formCaption}>確定済みの予定</ThemedText>
                            <ScheduleChip
                              iso={formConfirmedDate}
                              status="confirmed"
                              actionsAlign="right"
                              actions={[
                                {
                                  key: 'clear',
                                  label: '削除',
                                  icon: 'close',
                                  color: DANGER,
                                  backgroundColor: 'rgba(248, 113, 113, 0.18)',
                                  onPress: handleClearConfirmed,
                                },
                              ]}
                            />
                          </View>
                        ) : null}

                        {formCandidates.length > 0 ? (
                          <View
                            style={[
                              styles.candidateBlock,
                              formConfirmedDate && styles.scheduleSummaryDivider,
                            ]}
                          >
                            <ThemedText style={styles.formCaption}>候補日</ThemedText>
                            <View style={styles.chipColumn}>
                              {formCandidates.map((iso) => (
                                <ScheduleChip
                                  key={iso}
                                  iso={iso}
                                  status="candidate"
                                  actions={[
                                    {
                                      key: 'promote',
                                      label: '確定',
                                      icon: 'event-available',
                                      color: SUCCESS,
                                      backgroundColor: 'rgba(34, 197, 94, 0.18)',
                                      onPress: () => handlePromoteCandidate(iso),
                                    },
                                    {
                                      key: 'remove',
                                      label: '削除',
                                      icon: 'close',
                                      color: DANGER,
                                      backgroundColor: 'rgba(248, 113, 113, 0.18)',
                                      onPress: () => handleRemoveCandidate(iso),
                                    },
                                  ]}
                                />
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    <View style={[styles.taskSection, styles.taskInlineSection]}>
                    <View style={styles.inputBlock}>
                      <View style={styles.labelRow}>
                        <ThemedText style={styles.fieldLabel}>タスク</ThemedText>
                      </View>
                      <View style={styles.taskComposer}>
                        <TextInput
                          style={[styles.input, styles.taskInput]}
                          value={formTaskDraft}
                          onChangeText={setFormTaskDraft}
                      placeholder="例:ES提出"
                          returnKeyType="done"
                          onSubmitEditing={handleAddTask}
                        />
                      </View>
                      {formTaskDue ? (
                        <View style={styles.taskDuePreview}>
                          <ScheduleChip iso={formTaskDue} status="task" />
                          <Pressable style={styles.taskDueClearButton} onPress={handleClearTaskDue}>
                            <MaterialIcons name="close" size={12} color={TEXT_MUTED} />
                            <ThemedText style={styles.taskDueClearLabel}>期限をクリア</ThemedText>
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
                            {formTaskDue ? '期限を変更' : '期限を設定'}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.secondaryButton,
                            styles.taskAddButton,
                            !canAddTask && styles.secondaryButtonDisabled,
                          ]}
                          onPress={handleAddTask}
                          disabled={!canAddTask}
                        >
                          <MaterialIcons name="add" size={16} color={PRIMARY} />
                          <ThemedText style={styles.secondaryButtonLabel}>追加</ThemedText>
                        </Pressable>
                      </View>
                    </View>
                    {formTasks.length > 0 ? (
                      <View style={styles.taskListPreview}>
                        {formTasks.map((task, index) => (
                          <View key={`${task.title}-${index}`} style={styles.taskPill}>
                            <View style={styles.taskPillText}>
                              <ThemedText style={styles.taskPillLabel}>{task.title}</ThemedText>
                              {task.dueDate ? (
                                <ThemedText style={styles.taskPillDue}>
                                  {formatTaskDueLabel(task.dueDate)}
                                </ThemedText>
                              ) : null}
                            </View>
                            <Pressable onPress={() => handleRemoveTask(index)} style={styles.taskPillRemove}>
                              <MaterialIcons name="close" size={14} color={TEXT_MUTED} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton} onPress={handleCancelCreate}>
                  <ThemedText style={styles.secondaryButtonLabel}>キャンセル</ThemedText>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={handleCreateCompany}>
                  <ThemedText style={styles.primaryButtonLabel}>保存</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </View>
        </Modal>

      </View>

      <SchedulePickerModal
        visible={pickerVisible}
        status={pickerMode === 'task' ? 'task' : pickerMode ?? 'candidate'}
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageHeader: {
    marginHorizontal: -20,
    paddingLeft: 20,
    paddingRight: 0,
    paddingBottom: 12,
    marginBottom: 28,
  },
  list: { flex: 1 },
  listContent: { gap: 16, paddingBottom: 160 },
  pageHeaderTitle: {
    color: TEXT_PRIMARY,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
  },
  pageHeaderSubtitle: {
    color: TEXT_MUTED,
  },
  primaryButton: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  primaryButtonLabel: { color: '#FFFFFF', fontWeight: '700' },
  emptyList: {
    marginHorizontal: 0,
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { color: TEXT_PRIMARY, fontWeight: '600', fontSize: 16 },
  emptyCopy: { color: TEXT_MUTED, fontSize: 13, textAlign: 'center' },
  formCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 24,
  },
  formHeader: {
    gap: 6,
  },
  sectionGroup: {
    gap: 4,
  },
  formTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
  },
  formHeading: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
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
  inputBlock: {
    width: '100%',
    gap: 4,
  },
  fieldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  requiredTag: {
    color: DANGER,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    shadowColor: '#CBD5F5',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  cardSurface: {
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    padding: 20,
    gap: 16,
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  statusBadgeLabel: { color: PRIMARY, fontWeight: '700', fontSize: 13 },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  metaColumn: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  metaValue: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  metaAction: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    lineHeight: 16,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  metaPillConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  metaPillLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaConfirmedLabel: {
    color: SUCCESS,
  },
  metaCandidateLabel: {
    color: PRIMARY,
  },
  cardCandidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cardCandidateLabel: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 11,
  },
  noteSnippet: {
    color: TEXT_MUTED,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
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
  multilineInput: { minHeight: 96, textAlignVertical: 'top' },
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
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonLabel: { color: PRIMARY, fontWeight: '600' },
  scheduleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 10,
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
  taskComposer: {
    width: '100%',
  },
  taskActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  taskInput: {
    flex: 1,
  },
  taskDueButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  taskAddButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  taskDuePreview: {
    marginTop: 8,
    width: '100%',
    gap: 8,
  },
  taskDueClearButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  taskDueClearLabel: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  taskListPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  taskPillLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  taskPillText: {
    flexDirection: 'column',
    gap: 2,
    alignItems: 'flex-start',
  },
  taskPillDue: {
    color: PRIMARY,
    fontSize: 11,
  },
  taskPillRemove: {
    padding: 2,
  },
  confirmedBlock: {
    gap: 8,
  },
  candidateBlock: {
    gap: 8,
  },
  formLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  formCaption: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  formHint: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 16,
    paddingHorizontal: 20,
  },
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    padding: 20,
    justifyContent: 'center',
  },
  createModalCard: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 0,
    maxHeight: '90%',
  },
  createModalContent: {
    paddingHorizontal: 20,
    gap: 24,
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
  modalButtonLabel: { color: TEXT_PRIMARY, fontWeight: '600' },
  modalPrimaryButton: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  modalPrimaryLabel: { color: '#FFFFFF', fontWeight: '700' },
  chipColumn: { gap: 12 },
});
