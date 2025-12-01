import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TaskEditModal from '@/app/features/tasks/components/TaskEditModal';
import { PageHeader } from '@/components/PageHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { useAppStore } from '@/store/useAppStore';
import { tasksStyles as styles } from '@/styles/tasksStyles';
import type { CompanyTaskItem } from '@/types/companyItems';

const { textMuted: TEXT_MUTED, primary: PRIMARY, success: SUCCESS } = Palette;

type TaskSection = {
  key: string;
  title: string;
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
      })),
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
        data: pendingTasks,
      });
    }

    if (completedTasks.length) {
      data.push({
        key: 'completed',
        title: '完了済み',
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
        ],
      );
      return;
    }
    removeTask(task.companyId, task.id);
  };

  const editingDueLabel =
    editingDueDate != null
      ? format(parseISO(editingDueDate), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", {
          locale: ja,
        })
      : '期限未設定';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PageHeader
          icon="checklist"
          title="タスク一覧"
          subtitle={`未完了 ${pendingCount} 件 / 合計 ${totalCount} 件`}
          iconColor={PRIMARY}
          iconBackgroundColor="rgba(37, 99, 235, 0.18)"
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
            </View>
          )}
          ListEmptyComponent={
            <ThemedView style={styles.emptyList}>
              <MaterialIcons name="checklist" size={36} color={PRIMARY} />
              <ThemedText style={styles.emptyTitle}>まだタスクが登録されていません</ThemedText>
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
                {/* 左カラム：タイトル＋会社名 */}
                <View style={styles.taskMain}>
                  <ThemedText
                    style={[styles.taskTitle, item.isDone && styles.done]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </ThemedText>

                  <Link href={`/(tabs)/companies/${item.companyId}`} asChild>
                    <Pressable>
                      <ThemedText style={styles.companyLink} numberOfLines={1} ellipsizeMode="tail">
                        {item.companyName}
                      </ThemedText>
                    </Pressable>
                  </Link>
                </View>

                <View style={styles.taskMeta}>
                  {item.dueDate ? (
                    <ThemedText style={styles.due}>
                      {format(parseISO(item.dueDate), 'M/d(EEE) HH:mm', { locale: ja })}
                    </ThemedText>
                  ) : (
                    <ThemedText style={styles.dueMuted}>期限未設定</ThemedText>
                  )}

                  <Pressable onPress={() => openEditModal(item)} style={styles.iconButton}>
                    <MaterialIcons name="edit" size={20} color={PRIMARY} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <TaskEditModal
        visible={Boolean(editingTask)}
        title={editingTitle}
        dueLabel={editingDueLabel}
        dueDate={editingDueDate}
        onChangeTitle={setEditingTitle}
        onRequestClose={closeEditModal}
        onSave={handleEditSave}
        onClearDueDate={() => setEditingDueDate(null)}
        onOpenDuePicker={() => setDuePickerVisible(true)}
        duePickerVisible={duePickerVisible}
        onDuePickerCancel={() => setDuePickerVisible(false)}
        onDuePickerConfirm={(iso) => {
          setEditingDueDate(iso);
          setDuePickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
}
