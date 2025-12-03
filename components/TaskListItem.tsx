import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Palette } from '@/constants/Palette';
import { NOTO_SANS_JP } from '@/constants/Typography';
import type { CompanyTaskItem } from '@/types/companyItems';

const { primary: PRIMARY, success: SUCCESS, textMuted: TEXT_MUTED, surface: SURFACE } = Palette;

export type TaskListItemProps = {
  task: CompanyTaskItem & { companyName: string; companyId: string };
  onToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /**
   * Show edit button when the task is not done (default true).
   */
  showEditForPending?: boolean;
  /**
   * Show delete button when the task is done (default true).
   */
  showDeleteForDone?: boolean;
  /**
   * Always show delete button regardless of status (default false).
   */
  showDeleteAlways?: boolean;
  /**
   * Link target for the company name. If provided, wraps the label in Link.
   */
  companyHref?: Href;
  /**
   * Whether to hide "期限未設定" when no due date (default false).
   */
  hideEmptyDue?: boolean;
};

export function TaskListItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  showEditForPending = true,
  showDeleteForDone = true,
  showDeleteAlways = false,
  companyHref,
  hideEmptyDue = false,
}: TaskListItemProps) {
  const showDelete = Boolean(onDelete) && (showDeleteAlways || (showDeleteForDone && task.isDone));
  const showEdit = Boolean(onEdit) && showEditForPending && !task.isDone;

  return (
    <View style={styles.taskRow}>
      <Pressable
        onPress={onToggle}
        style={[styles.check, task.isDone && styles.checkDone]}
        accessibilityRole="button"
        accessibilityLabel={task.isDone ? 'タスクを未完了に戻す' : 'タスクを完了にする'}
      >
        <MaterialIcons
          name={task.isDone ? 'check-circle' : 'radio-button-unchecked'}
          size={20}
          color={task.isDone ? SUCCESS : PRIMARY}
        />
      </Pressable>

      <View style={styles.taskContent}>
        <View style={styles.taskMain}>
          <ThemedText
            style={[styles.taskTitle, task.isDone && styles.done]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {task.title}
          </ThemedText>

          {companyHref ? (
            <Link href={companyHref} asChild>
              <Pressable>
                <ThemedText style={styles.companyLink} numberOfLines={1} ellipsizeMode="tail">
                  {task.companyName}
                </ThemedText>
              </Pressable>
            </Link>
          ) : (
            <ThemedText style={styles.companyLink} numberOfLines={1} ellipsizeMode="tail">
              {task.companyName}
            </ThemedText>
          )}
        </View>

        <View style={styles.metaRow}>
          {task.dueDate ? (
            <ThemedText style={styles.due} numberOfLines={1}>
              {format(parseISO(task.dueDate), 'M/d(EEE) HH:mm', { locale: ja })}
            </ThemedText>
          ) : hideEmptyDue ? (
            <View />
          ) : (
            <ThemedText style={styles.dueMuted} numberOfLines={1}>
              期限未設定
            </ThemedText>
          )}

          {showDelete ? (
            <Pressable onPress={onDelete} style={styles.deleteButton}>
              <MaterialIcons name="delete-outline" size={18} color="#fff" />
            </Pressable>
          ) : showEdit ? (
            <Pressable onPress={onEdit} style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color={PRIMARY} />
            </Pressable>
          ) : (
            <View style={{ width: 26 }} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  check: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { opacity: 0.5 },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskMain: {
    flexShrink: 1,
    alignItems: 'flex-start',
    gap: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Palette.textPrimary,
    fontFamily: NOTO_SANS_JP.semibold,
  },
  done: { opacity: 0.5, textDecorationLine: 'line-through' },
  companyLink: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: 0,
    marginTop: -4,
    fontFamily: NOTO_SANS_JP.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 10,
    gap: 8,
    width: 140,
  },
  due: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'right',
    fontFamily: NOTO_SANS_JP.medium,
    marginRight: 6,
  },
  dueMuted: {
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'right',
    fontFamily: NOTO_SANS_JP.medium,
    marginRight: 6,
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    borderWidth: 0,
    borderColor: 'transparent',
    marginRight: 2,
  },
  editButton: {
    padding: 6,
    marginLeft: 4,
  },
});
