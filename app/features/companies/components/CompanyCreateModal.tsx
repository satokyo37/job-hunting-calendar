import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { ScheduleChip } from '@/components/ScheduleChip';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { PROGRESS_STATUS_ITEMS } from '@/constants/progressStatus';
import { companiesStyles as styles } from '@/styles/companiesStyles';

const { primary: PRIMARY, success: SUCCESS, danger: DANGER, textMuted: TEXT_MUTED } = Palette;

type ProgressMeta = (typeof PROGRESS_STATUS_ITEMS)[number];

type DraftTask = {
  title: string;
  dueDate?: string;
};

type CompanyCreateModalProps = {
  visible: boolean;
  formName: string;
  onChangeFormName: (value: string) => void;
  selectedProgressMeta?: ProgressMeta;
  onOpenStatusPicker: () => void;
  formNotes: string;
  onChangeFormNotes: (value: string) => void;
  formNextAction: string;
  onChangeFormNextAction: (value: string) => void;
  onAddCandidatePress: () => void;
  formConfirmedDate?: string;
  formCandidates: string[];
  onClearConfirmed: () => void;
  onPromoteCandidate: (iso: string) => void;
  onRemoveCandidate: (iso: string) => void;
  hasSchedulePreview: boolean;
  formTaskDraft: string;
  onChangeFormTaskDraft: (value: string) => void;
  formTaskDue?: string;
  onAddTaskDuePress: () => void;
  onClearTaskDue: () => void;
  canAddTask: boolean;
  onAddTask: () => void;
  formTasks: DraftTask[];
  onRemoveTask: (index: number) => void;
  onCancel: () => void;
  onSave: () => void;
};

const formatTaskDueLabel = (iso: string) => format(parseISO(iso), 'M月d日 HH:mm', { locale: ja });

export default function CompanyCreateModal({
  visible,
  formName,
  onChangeFormName,
  selectedProgressMeta,
  onOpenStatusPicker,
  formNotes,
  onChangeFormNotes,
  formNextAction,
  onChangeFormNextAction,
  onAddCandidatePress,
  formConfirmedDate,
  formCandidates,
  onClearConfirmed,
  onPromoteCandidate,
  onRemoveCandidate,
  hasSchedulePreview,
  formTaskDraft,
  onChangeFormTaskDraft,
  formTaskDue,
  onAddTaskDuePress,
  onClearTaskDue,
  canAddTask,
  onAddTask,
  formTasks,
  onRemoveTask,
  onCancel,
  onSave,
}: CompanyCreateModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.createModalOverlay}>
        <ThemedView style={styles.createModalCard}>
          <ScrollView
            contentContainerStyle={styles.createModalContent}
            keyboardShouldPersistTaps="handled"
          >
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
                  <TextInput
                    style={styles.input}
                    value={formName}
                    onChangeText={onChangeFormName}
                  />
                </View>
                <View style={styles.inputBlock}>
                  <View style={styles.labelRow}>
                    <ThemedText style={styles.fieldLabel}>進捗ステータス</ThemedText>
                    <ThemedText style={styles.requiredTag}>必須</ThemedText>
                  </View>
                  <Pressable
                    style={[styles.input, styles.selectInput]}
                    onPress={onOpenStatusPicker}
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
                    value={formNotes}
                    onChangeText={onChangeFormNotes}
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
                    style={[styles.input, styles.scheduleTitleInput]}
                    value={formNextAction}
                    onChangeText={onChangeFormNextAction}
                    placeholder="例: 一次面接"
                    returnKeyType="done"
                  />
                </View>

                <View style={styles.scheduleActions}>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      formConfirmedDate && styles.secondaryButtonDisabled,
                    ]}
                    disabled={Boolean(formConfirmedDate)}
                    onPress={onAddCandidatePress}
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
                          title={formNextAction.trim() || undefined}
                          actionsAlign="right"
                          actions={[
                            {
                              key: 'clear',
                              label: '削除',
                              icon: 'close',
                              color: DANGER,
                              backgroundColor: 'rgba(248, 113, 113, 0.18)',
                              onPress: onClearConfirmed,
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
                              title={formNextAction.trim() || undefined}
                              actions={[
                                {
                                  key: 'promote',
                                  label: '確定',
                                  icon: 'event-available',
                                  color: SUCCESS,
                                  backgroundColor: 'rgba(34, 197, 94, 0.18)',
                                  onPress: () => onPromoteCandidate(iso),
                                },
                                {
                                  key: 'remove',
                                  label: '削除',
                                  icon: 'close',
                                  color: DANGER,
                                  backgroundColor: 'rgba(248, 113, 113, 0.18)',
                                  onPress: () => onRemoveCandidate(iso),
                                },
                              ]}
                            />
                          ))}
                        </View>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.sectionGroup}>
              <ThemedText style={styles.formHeading}>タスク</ThemedText>
              <View style={[styles.formSection, styles.taskSection]}>
                <View style={styles.inputBlock}>
                  <ThemedText style={styles.fieldLabel}>内容</ThemedText>
                  <View style={styles.taskComposer}>
                    <TextInput
                      style={[styles.input, styles.taskInput]}
                      value={formTaskDraft}
                      onChangeText={onChangeFormTaskDraft}
                      placeholder="例:ES提出"
                      returnKeyType="done"
                      onSubmitEditing={onAddTask}
                    />
                  </View>
                  {formTaskDue ? (
                    <View style={styles.taskDuePreview}>
                      <ScheduleChip
                        iso={formTaskDue}
                        status="task"
                        title={formTaskDraft.trim() || undefined}
                      />
                      <Pressable style={styles.taskDueClearButton} onPress={onClearTaskDue}>
                        <MaterialIcons name="close" size={12} color={TEXT_MUTED} />
                        <ThemedText style={styles.taskDueClearLabel}>締切をクリア</ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                  <View style={styles.taskActionsRow}>
                    <Pressable
                      style={[styles.secondaryButton, styles.taskDueButton]}
                      onPress={onAddTaskDuePress}
                    >
                      <MaterialIcons name="event" size={16} color={PRIMARY} />
                      <ThemedText style={styles.secondaryButtonLabel}>
                        {formTaskDue ? '締切を変更' : '締切を設定'}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        styles.taskAddButton,
                        !canAddTask && styles.secondaryButtonDisabled,
                      ]}
                      onPress={onAddTask}
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
                        <Pressable
                          onPress={() => onRemoveTask(index)}
                          style={styles.taskPillRemove}
                        >
                          <MaterialIcons name="close" size={14} color={TEXT_MUTED} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={[styles.modalButton, styles.modalButtonSecondary]} onPress={onCancel}>
              <ThemedText style={styles.modalButtonSecondaryLabel}>キャンセル</ThemedText>
            </Pressable>
            <Pressable style={[styles.modalButton, styles.modalButtonPrimary]} onPress={onSave}>
              <ThemedText style={styles.modalButtonPrimaryLabel}>保存</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}
