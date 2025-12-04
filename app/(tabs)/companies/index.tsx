import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CompanyCreateModal from '@/app/features/companies/components/CompanyCreateModal';
import { PageHeader } from '@/components/PageHeader';
import { ProgressStatusPickerModal } from '@/components/ProgressStatusPickerModal';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { PROGRESS_STATUS_ITEMS, ProgressStatusValue } from '@/constants/progressStatus';
import { useAppStore } from '@/store/useAppStore';
import { companiesStyles as styles } from '@/styles/companiesStyles';

const { primary: PRIMARY, success: SUCCESS, textMuted: TEXT_MUTED } = Palette;

type PickerMode = 'candidate' | 'task';

export default function CompaniesScreen() {
  const companies = useAppStore((state) => state.companies);
  const createCompany = useAppStore((state) => state.createCompany);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProgress, setFormProgress] = useState<ProgressStatusValue | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formNextAction, setFormNextAction] = useState('');
  const [formTasks, setFormTasks] = useState<{ title: string; dueDate?: string }[]>([]);
  const [formTaskDraft, setFormTaskDraft] = useState('');
  const [formTaskDue, setFormTaskDue] = useState<string | undefined>();
  const [formCandidates, setFormCandidates] = useState<string[]>([]);
  const [formConfirmedDate, setFormConfirmedDate] = useState<string | undefined>();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);

  const selectedProgressMeta = useMemo(
    () => PROGRESS_STATUS_ITEMS.find((item) => item.value === formProgress),
    [formProgress],
  );

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
      formProgress ||
      formNotes.trim() ||
      formNextAction.trim() ||
      formTaskDraft.trim() ||
      formTaskDue ||
      formTasks.length > 0 ||
      formCandidates.length > 0 ||
      formConfirmedDate;
    if (hasChanges) {
      Alert.alert(
        '入力内容を破棄しますか？',
        'キャンセルすると入力中の内容はすべて削除されます。',
        [
          { text: '続ける', style: 'cancel' },
          {
            text: '破棄する',
            style: 'destructive',
            onPress: () => {
              resetForm();
              setCreateModalVisible(false);
              setStatusPickerVisible(false);
            },
          },
        ],
      );
      return;
    }
    setCreateModalVisible(false);
    setStatusPickerVisible(false);
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

  const handleOpenStatusPicker = useCallback(() => {
    setStatusPickerVisible(true);
  }, []);

  const handleCloseStatusPicker = useCallback(() => {
    setStatusPickerVisible(false);
  }, []);

  const handleStatusSelect = useCallback((value: ProgressStatusValue) => {
    setFormProgress(value);
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
    [handlePickerClose, pickerMode],
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'task' && formTaskDue) return formTaskDue;
    return undefined;
  }, [pickerMode, formTaskDue]);

  const pickerTitle = useMemo(() => {
    if (pickerMode === 'candidate') {
      const value = formNextAction.trim();
      return value.length > 0 ? value : undefined;
    }
    if (pickerMode === 'task') {
      const value = formTaskDraft.trim();
      return value.length > 0 ? value : undefined;
    }
    return undefined;
  }, [formNextAction, formTaskDraft, pickerMode]);

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
    const progress = formProgress;
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
    setStatusPickerVisible(false);
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
    setStatusPickerVisible,
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
          contentContainerStyle={[
            styles.listContent,
            companies.length === 0 && styles.emptyContent,
          ]}
          data={companies}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ThemedView style={styles.emptyList}>
              <MaterialIcons name="business" size={36} color={PRIMARY} />
              <ThemedText style={styles.emptyTitle}>まだ企業が追加されていません</ThemedText>
            </ThemedView>
          }
          ListHeaderComponent={null}
          renderItem={({ item }) => {
            const hasConfirmed = Boolean(item.confirmedDate);
            const candidateCount = item.candidateDates.length;
            const hasCandidates = candidateCount > 0;

            const title = item.nextAction?.trim() || '';

            let scheduleLabel = '予定なし';
            let scheduleIcon: keyof typeof MaterialIcons.glyphMap = 'event-busy';
            let scheduleColor = TEXT_MUTED;

            if (hasConfirmed) {
              scheduleIcon = 'event-available';
              scheduleColor = SUCCESS;

              const dateLabel = format(parseISO(item.confirmedDate!), 'M月d日(E) HH:mm', {
                locale: ja,
              });

              scheduleLabel = title ? `${title}　${dateLabel}` : `確定 ${dateLabel}`;
            } else if (hasCandidates) {
              scheduleIcon = 'event';
              scheduleColor = PRIMARY;

              const baseTitle = title || '候補日';
              scheduleLabel = `${baseTitle}　候補日 ${candidateCount}件`;
            }

            const hasMemo = Boolean(item.remarks && item.remarks.trim().length > 0);
            const taskCount = item.tasks?.length ?? 0;

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

                    <View style={styles.summaryRow}>
                      <MaterialIcons name={scheduleIcon} size={16} color={scheduleColor} />
                      <ThemedText
                        style={[styles.summaryText, { color: scheduleColor }]}
                        numberOfLines={1}
                      >
                        {scheduleLabel}
                      </ThemedText>
                    </View>

                    {(hasMemo || taskCount > 0) && (
                      <View style={styles.tagRow}>
                        {hasMemo && (
                          <View style={styles.tagPill}>
                            <ThemedText style={styles.tagPillLabel}>メモあり</ThemedText>
                          </View>
                        )}
                        {taskCount > 0 && (
                          <View style={styles.tagPill}>
                            <ThemedText style={styles.tagPillLabel}>
                              タスク {taskCount}件
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>
              </Link>
            );
          }}
        />

        <CompanyCreateModal
          visible={createModalVisible}
          formName={formName}
          onChangeFormName={setFormName}
          selectedProgressMeta={selectedProgressMeta}
          onOpenStatusPicker={handleOpenStatusPicker}
          formNotes={formNotes}
          onChangeFormNotes={setFormNotes}
          formNextAction={formNextAction}
          onChangeFormNextAction={setFormNextAction}
          onAddCandidatePress={() => {
            if (formConfirmedDate) return;
            handlePickerOpen('candidate');
          }}
          formConfirmedDate={formConfirmedDate}
          formCandidates={formCandidates}
          onClearConfirmed={handleClearConfirmed}
          onPromoteCandidate={handlePromoteCandidate}
          onRemoveCandidate={handleRemoveCandidate}
          hasSchedulePreview={hasSchedulePreview}
          formTaskDraft={formTaskDraft}
          onChangeFormTaskDraft={setFormTaskDraft}
          formTaskDue={formTaskDue}
          onAddTaskDuePress={() => handlePickerOpen('task')}
          onClearTaskDue={handleClearTaskDue}
          canAddTask={canAddTask}
          onAddTask={handleAddTask}
          formTasks={formTasks}
          onRemoveTask={handleRemoveTask}
          onCancel={handleCancelCreate}
          onSave={handleCreateCompany}
        />
      </View>

      <ProgressStatusPickerModal
        visible={createModalVisible && statusPickerVisible}
        selected={formProgress || null}
        onClose={handleCloseStatusPicker}
        onSelect={handleStatusSelect}
      />

      <SchedulePickerModal
        visible={pickerVisible}
        status={pickerMode === 'task' ? 'task' : (pickerMode ?? 'candidate')}
        initialValue={pickerInitialValue}
        title={pickerTitle}
        onCancel={handlePickerClose}
        onConfirm={handlePickerConfirm}
      />
    </SafeAreaView>
  );
}
