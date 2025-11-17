import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/PageHeader';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { useAppStore } from '@/store/useAppStore';
import type { CompanyTaskItem } from '@/types/companyItems';

const {
  background: BACKGROUND,
  surface: SURFACE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  primary: PRIMARY,
  success: SUCCESS,
} = Palette;

type TaskSection = {
  key: string;
  title: string;
  caption: string;
  data: CompanyTaskItem[];
};

export default function TasksTabScreen() {
  const companies = useAppStore((s) => s.companies);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const removeTask = useAppStore((s) => s.removeTaskFromCompany);
  const updateTask = useAppStore((s) => s.updateTaskInCompany);

  const { pendingTasks, completedTasks } = useMemo(() => {
    const items = companies.flatMap((company) =>
      company.tasks.map((task) => ({
        ...task,
        companyId: company.id,
        companyName: company.name,
      }))
    );

    const sortPending = (a: CompanyTaskItem, b: CompanyTaskItem) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    };

    const pending = items.filter((task) => !task.isDone).sort(sortPending);

    const completed = items
      .filter((task) => task.isDone)
      .sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return bd - ad;
      });

    return { pendingTasks: pending, completedTasks: completed };
  }, [companies]);

  const sections = useMemo<TaskSection[]>(() => {
    const data: TaskSection[] = [];

    if (pendingTasks.length) {
      data.push({
        key: 'pending',
        title: '進行中のタスク',
        caption: '優先して取り組む予定のタスクをまとめています',
        data: pendingTasks,
      });
    }

    if (completedTasks.length) {
      data.push({
        key: 'completed',
        title: '完了済み',
        caption: '対応が終わったタスクはここで振り返れます',
        data: completedTasks,
      });
    }

    return data;
  }, [completedTasks, pendingTasks]);

  const totalCount = pendingTasks.length + completedTasks.length;
  const pendingCount = pendingTasks.length;
  const isEmpty = totalCount === 0;

  const [editingTask, setEditingTask] = useState<CompanyTaskItem | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [duePickerVisible, setDuePickerVisible] = useState(false);

  const openEditModal = (task: CompanyTaskItem) => {
    setEditingTask(task);
    setEditingTitle(task.title);
    setEditingDueDate(task.dueDate ?? null);
  };

  const closeEditModal = () => {
    setEditingTask(null);
    setEditingTitle('');
    setEditingDueDate(null);
    setDuePickerVisible(false);
  };

  const handleEditSave = () => {
    if (!editingTask) return;
    const nextTitle = editingTitle.trim();
    if (!nextTitle) {
      Alert.alert('タスク名を入力してください');
      return;
    }
    updateTask(editingTask.companyId, editingTask.id, {
      title: nextTitle,
      dueDate: editingDueDate,
    });
    closeEditModal();
  };

  const handleRemoveTask = (task: CompanyTaskItem) => {
    if (!task.isDone) {
      Alert.alert(
        '未完了のタスクを削除しますか？',
        '完了していないタスクです。削除すると元に戻せません。',
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '削除',
            style: 'destructive',
            onPress: () => removeTask(task.companyId, task.id),
          },
        ]
      );
      return;
    }
    removeTask(task.companyId, task.id);
  };

  const editingDueLabel =
    editingDueDate != null
      ? format(parseISO(editingDueDate), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", { locale: ja })
      : '期限未設定';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PageHeader
          icon="checklist"
          title="タスク一覧"
          subtitle={`未完了 ${pendingCount} 件 / 合計 ${totalCount} 件`}
          iconColor={PRIMARY}
          iconBackgroundColor="rgba(34, 197, 94, 0.18)"
          style={styles.pageHeader}
          titleStyle={styles.pageHeaderTitle}
          subtitleStyle={styles.pageHeaderSubtitle}
        />

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          style={styles.list}
          contentContainerStyle={[styles.listContent, isEmpty && styles.emptyContent]}
          SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              <ThemedText style={styles.sectionCaption}>{section.caption}</ThemedText>
            </View>
          )}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText style={styles.emptyText}>登録されたタスクはありません</ThemedText>
              <ThemedText style={styles.emptyHint}>
                各企業詳細ページの「タスク」セクションから追加できます
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <View style={styles.taskRow}>
              <Pressable
                onPress={() => toggleTaskDone(item.companyId, item.id)}
                style={[styles.check, item.isDone && styles.checkDone]}
              >
                <MaterialIcons
                  name={item.isDone ? 'check-circle' : 'radio-button-unchecked'}
                  size={20}
                  color={item.isDone ? SUCCESS : PRIMARY}
                />
              </Pressable>

              <View style={styles.taskBody}>
                <ThemedText style={[styles.taskTitle, item.isDone && styles.done]}>
                  {item.title}
                </ThemedText>
                <View style={styles.metaRow}>
                  <Link href={`/(tabs)/companies/${item.companyId}`} asChild>
                    <Pressable>
                      <ThemedText style={styles.companyLink}>{item.companyName}</ThemedText>
                    </Pressable>
                  </Link>
                  {item.dueDate ? (
                    <ThemedText style={styles.due}>
                      {format(parseISO(item.dueDate), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", {
                        locale: ja,
                      })}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.dueMuted}>期限未設定</ThemedText>
                  )}
                </View>
              </View>

              <View style={styles.rowActions}>
                <Pressable onPress={() => openEditModal(item)} style={styles.iconButton}>
                  <MaterialIcons name="edit" size={20} color={PRIMARY} />
                </Pressable>
                <Pressable onPress={() => handleRemoveTask(item)} style={styles.iconButton}>
                  <MaterialIcons name="delete-outline" size={20} color={TEXT_MUTED} />
                </Pressable>
              </View>
            </View>
          )}
        />
      </View>

      <Modal
        visible={Boolean(editingTask)}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>タスクを編集</ThemedText>
            <View style={styles.modalField}>
              <ThemedText style={styles.modalLabel}>タイトル</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="タスク名を入力"
              />
            </View>
            <View style={styles.modalField}>
              <View style={styles.modalFieldHeader}>
                <ThemedText style={styles.modalLabel}>期限</ThemedText>
                {editingDueDate ? (
                  <Pressable onPress={() => setEditingDueDate(null)}>
                    <ThemedText style={styles.clearDueButton}>解除</ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.modalDueRow}>
                <ThemedText style={styles.modalDueValue}>{editingDueLabel}</ThemedText>
                <Pressable
                  style={styles.duePickerButton}
                  onPress={() => setDuePickerVisible(true)}
                >
                  <MaterialIcons name="schedule" size={16} color={PRIMARY} />
                  <ThemedText style={styles.duePickerLabel}>設定</ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalSecondary]} onPress={closeEditModal}>
                <ThemedText style={styles.modalSecondaryLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalPrimary]} onPress={handleEditSave}>
                <ThemedText style={styles.modalPrimaryLabel}>保存</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <SchedulePickerModal
        visible={duePickerVisible}
        status="task"
        initialValue={editingDueDate ?? undefined}
        onCancel={() => setDuePickerVisible(false)}
        onConfirm={(iso) => {
          setEditingDueDate(iso);
          setDuePickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BACKGROUND },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  pageHeader: { marginBottom: 12 },
  pageHeaderTitle: { color: TEXT_PRIMARY, fontSize: 22, fontWeight: '700' },
  pageHeaderSubtitle: { color: TEXT_MUTED, fontSize: 13 },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 120 },
  sectionHeader: { gap: 2, marginBottom: 8 },
  sectionTitle: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '700' },
  sectionCaption: { color: TEXT_MUTED, fontSize: 12 },
  sectionSeparator: { height: 16 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  empty: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { color: TEXT_PRIMARY, fontWeight: '600' },
  emptyHint: { color: TEXT_MUTED, fontSize: 12, textAlign: 'center' },
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
  check: { width: 28, alignItems: 'center' },
  checkDone: { opacity: 0.5 },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { color: TEXT_PRIMARY, fontWeight: '600' },
  done: { opacity: 0.5, textDecorationLine: 'line-through' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  companyLink: { color: PRIMARY, fontSize: 12, fontWeight: '600', maxWidth: '45%' },
  due: { color: TEXT_MUTED, fontSize: 12 },
  dueMuted: { color: TEXT_MUTED, fontSize: 12, fontStyle: 'italic' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { padding: 4 },
  deleteBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    padding: 24,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  modalTitle: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalField: { gap: 8 },
  modalLabel: { color: TEXT_PRIMARY, fontWeight: '600', fontSize: 13 },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
  },
  modalFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearDueButton: { color: PRIMARY, fontWeight: '600' },
  modalDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalDueValue: { color: TEXT_PRIMARY, fontWeight: '600', flex: 1, marginRight: 12 },
  duePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  duePickerLabel: { color: PRIMARY, fontWeight: '600', fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  modalSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: 'transparent',
  },
  modalPrimary: {
    backgroundColor: PRIMARY,
  },
  modalSecondaryLabel: { color: TEXT_MUTED, fontWeight: '600' },
  modalPrimaryLabel: { color: '#FFFFFF', fontWeight: '700' },
});

