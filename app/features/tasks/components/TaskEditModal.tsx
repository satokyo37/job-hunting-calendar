import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { Palette } from '@/constants/Palette';
import { tasksStyles as styles } from '@/styles/tasksStyles';

const { primary: PRIMARY } = Palette;

type TaskEditModalProps = {
  visible: boolean;
  title: string;
  dueLabel: string;
  dueDate: string | null;
  onChangeTitle: (value: string) => void;
  onRequestClose: () => void;
  onSave: () => void;
  onClearDueDate: () => void;
  onOpenDuePicker: () => void;
  duePickerVisible: boolean;
  onDuePickerCancel: () => void;
  onDuePickerConfirm: (iso: string) => void;
};

export default function TaskEditModal({
  visible,
  title,
  dueLabel,
  dueDate,
  onChangeTitle,
  onRequestClose,
  onSave,
  onClearDueDate,
  onOpenDuePicker,
  duePickerVisible,
  onDuePickerCancel,
  onDuePickerConfirm,
}: TaskEditModalProps) {
  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
        <Pressable style={styles.modalOverlay} onPress={onRequestClose}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>タスクを編集</ThemedText>
            <View style={styles.modalField}>
              <ThemedText style={styles.modalLabel}>タイトル</ThemedText>
              <TextInput
                style={styles.modalInput}
                value={title}
                onChangeText={onChangeTitle}
                placeholder="タスク内容を入力"
              />
            </View>
            <View style={styles.modalField}>
              <View style={styles.modalFieldHeader}>
                <ThemedText style={styles.modalLabel}>期限</ThemedText>
                {dueDate ? (
                  <Pressable onPress={onClearDueDate}>
                    <ThemedText style={styles.clearDueButton}>解除</ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.modalDueRow}>
                <ThemedText style={styles.modalDueValue}>{dueLabel}</ThemedText>
                <Pressable style={styles.duePickerButton} onPress={onOpenDuePicker}>
                  <MaterialIcons name="schedule" size={16} color={PRIMARY} />
                  <ThemedText style={styles.duePickerLabel}>設定</ThemedText>
                </Pressable>
              </View>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={onRequestClose}
              >
                <ThemedText style={styles.modalSecondaryLabel}>キャンセル</ThemedText>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalPrimary]} onPress={onSave}>
                <ThemedText style={styles.modalPrimaryLabel}>保存</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <SchedulePickerModal
        visible={duePickerVisible}
        status="task"
        initialValue={dueDate ?? undefined}
        onCancel={onDuePickerCancel}
        onConfirm={onDuePickerConfirm}
      />
    </>
  );
}
