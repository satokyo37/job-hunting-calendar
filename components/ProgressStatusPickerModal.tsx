import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { PROGRESS_STATUS_ITEMS, ProgressStatusValue } from '@/constants/progressStatus';

type Props = {
  visible: boolean;
  selected?: ProgressStatusValue | null;
  onClose: () => void;
  onSelect: (value: ProgressStatusValue) => void;
};

export function ProgressStatusPickerModal({ visible, selected, onClose, onSelect }: Props) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <ThemedText style={styles.title}>進捗ステータスを選択</ThemedText>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {PROGRESS_STATUS_ITEMS.map((item) => {
              const isSelected = item.value === selected;
              return (
                <Pressable
                  key={item.key}
                  style={[styles.option, isSelected && styles.optionActive]}
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      { backgroundColor: item.background, borderColor: item.border },
                    ]}
                  >
                    <MaterialIcons name={item.icon as any} size={18} color={item.accent} />
                  </View>
                  <View style={styles.optionBody}>
                    <ThemedText style={styles.optionLabel}>{item.value}</ThemedText>
                    <ThemedText style={styles.optionDescription}>{item.description}</ThemedText>
                  </View>
                  <MaterialIcons
                    name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={isSelected ? item.accent : '#94A3B8'}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
    maxHeight: '90%',
  },
  list: {
    marginTop: 8,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 232, 240, 1)',
    gap: 12,
  },
  optionActive: {
    borderColor: '#2563EB',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  optionBody: {
    flex: 1,
  },
  optionDescription: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: {
    fontWeight: '600',
    color: '#0F172A',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    color: '#0F172A',
  },
});
