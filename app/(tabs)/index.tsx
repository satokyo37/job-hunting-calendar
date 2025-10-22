import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND = '#F2F6FF';
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F8FAFF';
const BORDER = '#D8E3FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#16A34A';
const WARNING = '#F97316';
const DANGER = '#EF4444';

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'yyyy年M月d日（EEE）HH:mm', { locale: ja });

type PickerMode = 'candidate' | 'confirmed';

const uniqueSortDates = (dates: string[]) =>
  Array.from(new Set(dates)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

export default function HomeScreen() {
  const companies = useAppStore((state) => state.companies);
  const createCompany = useAppStore((state) => state.createCompany);

  const [isFormOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProgress, setFormProgress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCandidates, setFormCandidates] = useState<string[]>([]);
  const [formConfirmedDate, setFormConfirmedDate] = useState<string | undefined>();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormProgress('');
    setFormNotes('');
    setFormCandidates([]);
    setFormConfirmedDate(undefined);
  }, []);

  const toggleForm = useCallback(() => {
    setFormOpen((prev) => !prev);
  }, []);

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
      if (!pickerMode) {
        return;
      }
      if (pickerMode === 'candidate') {
        setFormCandidates((prev) => uniqueSortDates([...prev, iso]));
      } else {
        setFormConfirmedDate(iso);
      }
      handlePickerClose();
    },
    [handlePickerClose, pickerMode]
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'confirmed' && formConfirmedDate) {
      return formConfirmedDate;
    }
    return undefined;
  }, [pickerMode, formConfirmedDate]);

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

  const handleCreateCompany = useCallback(() => {
    const name = formName.trim();
    const progress = formProgress.trim();
    if (!name || !progress) {
      Alert.alert('入力エラー', '会社名と進捗ステータスを入力してください。');
      return;
    }

    createCompany({
      name,
      progressStatus: progress,
      candidateDates: formCandidates,
      confirmedDate: formConfirmedDate,
      remarks: formNotes.trim() || undefined,
    });

    resetForm();
    setFormOpen(false);
  }, [
    createCompany,
    formCandidates,
    formConfirmedDate,
    formName,
    formNotes,
    formProgress,
    resetForm,
  ]);

  const sortedCompanies = useMemo(
    () =>
      [...companies].sort((a, b) => {
        const aDate = a.confirmedDate ?? a.candidateDates[0];
        const bDate = b.confirmedDate ?? b.candidateDates[0];

        if (!aDate && !bDate) return a.name.localeCompare(b.name);
        if (!aDate) return 1;
        if (!bDate) return -1;

        return new Date(aDate).getTime() - new Date(bDate).getTime();
      }),
    [companies]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroText}>
            <ThemedText type="title" style={styles.heroTitle}>
              企業一覧
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroSubtitle}>
              進捗と予定をひと目でチェックしましょう
            </ThemedText>
          </View>
          <Pressable style={styles.primaryButton} onPress={toggleForm}>
            <MaterialIcons name="add-circle" size={20} color="#FFFFFF" />
            <ThemedText style={styles.primaryButtonLabel}>企業を追加</ThemedText>
          </Pressable>
        </View>

        {sortedCompanies.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <ThemedText type="subtitle">まだ企業が登録されていません。</ThemedText>
            <ThemedText>右上の「企業を追加」から登録してみましょう。</ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={sortedCompanies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const nextSchedule = item.confirmedDate ?? item.candidateDates[0] ?? null;
              const scheduleIcon = item.confirmedDate ? 'event-available' : 'event';
              return (
                <Link href={`/company/${item.id}`} asChild>
                  <Pressable style={styles.card}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="title" style={styles.companyName}>
                        {item.name}
                      </ThemedText>
                      <View style={styles.statusBadge}>
                        <ThemedText style={styles.statusBadgeLabel}>
                          {item.progressStatus}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.scheduleRow}>
                      <MaterialIcons
                        name={nextSchedule ? scheduleIcon : 'event-busy'}
                        size={18}
                        color={
                          nextSchedule
                            ? item.confirmedDate
                              ? SUCCESS
                              : PRIMARY
                            : WARNING
                        }
                      />
                      <ThemedText style={styles.scheduleText}>
                        {nextSchedule ? formatDisplayDate(nextSchedule) : '予定未設定'}
                      </ThemedText>
                    </View>

                    {item.remarks ? (
                      <ThemedText style={styles.remarks} numberOfLines={2}>
                        {item.remarks}
                      </ThemedText>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <View style={styles.detailLinkIcon}>
                        <MaterialIcons name="info" size={16} color={PRIMARY} />
                      </View>
                      <ThemedText style={styles.detailLink}>詳細を見る</ThemedText>
                      <MaterialIcons name="chevron-right" size={20} color={PRIMARY} />
                    </View>
                  </Pressable>
                </Link>
              );
            }}
          />
        )}

        <Link href="/(tabs)/calendar" asChild>
          <Pressable style={styles.calendarShortcut}>
            <MaterialIcons name="calendar-today" size={18} color="#FFFFFF" />
            <ThemedText style={styles.calendarShortcutLabel}>カレンダーで確認</ThemedText>
          </Pressable>
        </Link>

        <ModalForm
          visible={isFormOpen}
          onRequestClose={() => {
            resetForm();
            setFormOpen(false);
          }}
          onSubmit={handleCreateCompany}
        >
          <TextInput
            placeholder="会社名"
            value={formName}
            onChangeText={setFormName}
            style={styles.input}
          />
          <TextInput
            placeholder="進捗ステータス（例：書類選考中）"
            value={formProgress}
            onChangeText={setFormProgress}
            style={styles.input}
          />
          <TextInput
            placeholder="メモ"
            value={formNotes}
            onChangeText={setFormNotes}
            multiline
            style={[styles.input, styles.multilineInput]}
          />

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>確定済み日程</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => handlePickerOpen('confirmed')}>
              <MaterialIcons name="event-available" size={16} color={PRIMARY} />
              <ThemedText style={styles.secondaryButtonLabel}>日程を設定</ThemedText>
            </Pressable>
          </View>
          {formConfirmedDate ? (
            <ScheduleChip
              iso={formConfirmedDate}
              status="confirmed"
              actions={[
                {
                  key: 'clear',
                  label: 'クリア',
                  icon: 'close',
                  color: DANGER,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  onPress: handleClearConfirmed,
                },
              ]}
            />
          ) : (
            <ThemedText style={styles.placeholder}>未設定</ThemedText>
          )}

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>候補日</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={() => handlePickerOpen('candidate')}>
              <MaterialIcons name="event-note" size={16} color={PRIMARY} />
              <ThemedText style={styles.secondaryButtonLabel}>追加</ThemedText>
            </Pressable>
          </View>

          {formCandidates.length === 0 ? (
            <ThemedText style={styles.placeholder}>
              候補日がまだ登録されていません。
            </ThemedText>
          ) : (
            <View style={styles.chipStack}>
              {formCandidates.map((candidate) => (
                <ScheduleChip
                  key={candidate}
                  iso={candidate}
                  status="candidate"
                  actions={[
                    {
                      key: 'confirm',
                      label: '確定',
                      icon: 'check-circle',
                      color: SUCCESS,
                      backgroundColor: 'rgba(22, 163, 74, 0.16)',
                      onPress: () => handlePromoteCandidate(candidate),
                    },
                    {
                      key: 'delete',
                      label: '削除',
                      icon: 'delete',
                      color: DANGER,
                      backgroundColor: 'rgba(239, 68, 68, 0.16)',
                      onPress: () => handleRemoveCandidate(candidate),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </ModalForm>

        <SchedulePickerModal
          visible={pickerVisible && Boolean(pickerMode)}
          status={pickerMode ?? 'candidate'}
          initialValue={pickerInitialValue}
          onCancel={handlePickerClose}
          onConfirm={handlePickerConfirm}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

type ModalFormProps = {
  visible: boolean;
  onRequestClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
};

function ModalForm({ visible, onRequestClose, onSubmit, children }: ModalFormProps) {
  return (
    <ScheduleFormModal
      visible={visible}
      title="企業を登録"
      cancelLabel="キャンセル"
      submitLabel="登録"
      onCancel={onRequestClose}
      onSubmit={onSubmit}
    >
      {children}
    </ScheduleFormModal>
  );
}

type ScheduleFormModalProps = {
  visible: boolean;
  title: string;
  cancelLabel: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: () => void;
  children: ReactNode;
};

function ScheduleFormModal({
  visible,
  title,
  cancelLabel,
  submitLabel,
  onCancel,
  onSubmit,
  children,
}: ScheduleFormModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalCard, styles.formModal]}>
          <ThemedText type="title" style={styles.modalTitle}>
            {title}
          </ThemedText>
          {children}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalButton} onPress={onCancel}>
              <ThemedText style={styles.modalButtonLabel}>{cancelLabel}</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.modalButton, styles.modalPrimaryButton]}
              onPress={onSubmit}
            >
              <ThemedText style={styles.modalPrimaryLabel}>{submitLabel}</ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 20,
    shadowColor: '#CBD5F5',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 3,
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: TEXT_MUTED,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    elevation: 2,
  },
  primaryButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 8,
  },
  listContent: {
    gap: 16,
    paddingBottom: 160,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 16,
    shadowColor: '#E0E9FF',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 2,
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
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  statusBadgeLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scheduleText: {
    color: TEXT_PRIMARY,
    flexShrink: 1,
  },
  remarks: {
    color: TEXT_MUTED,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLinkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLink: {
    color: PRIMARY,
    fontWeight: '600',
  },
  calendarShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  calendarShortcutLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    padding: 24,
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    backgroundColor: SURFACE,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    gap: 18,
  },
  formModal: {
    gap: 18,
  },
  modalTitle: {
    textAlign: 'center',
    color: TEXT_PRIMARY,
    fontWeight: '700',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: SURFACE,
    color: TEXT_PRIMARY,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
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
  secondaryButtonLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  chipStack: {
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
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
  modalButtonLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  modalPrimaryLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
