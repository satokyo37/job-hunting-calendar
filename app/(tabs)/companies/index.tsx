import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/PageHeader';
import { ScheduleChip } from '@/components/ScheduleChip';
import { SchedulePickerModal } from '@/components/SchedulePickerModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND = '#EFF6FF';
const SURFACE = '#FFFFFF';
const SURFACE_SUBTLE = '#F8FAFF';
const BORDER = '#D9E6FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#22C55E';
const WARNING = '#F59E0B';
const DANGER = '#F87171';

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), "yyyy'年'MM'月'dd'日'(EEE)HH:mm", { locale: ja });

type PickerMode = 'candidate' | 'confirmed';

export default function CompaniesScreen() {
  const companies = useAppStore((state) => state.companies);
  const createCompany = useAppStore((state) => state.createCompany);

  const [isFormOpen, setFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formProgress, setFormProgress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formNextAction, setFormNextAction] = useState('');
  const [formCandidates, setFormCandidates] = useState<string[]>([]);
  const [formConfirmedDate, setFormConfirmedDate] = useState<string | undefined>();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormProgress('');
    setFormNotes('');
    setFormNextAction('');
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
      if (!pickerMode) return;
      if (pickerMode === 'candidate') {
        setFormCandidates((prev) => Array.from(new Set([...prev, iso])).sort());
      } else {
        setFormConfirmedDate(iso);
      }
      handlePickerClose();
    },
    [handlePickerClose, pickerMode]
  );

  const pickerInitialValue = useMemo(() => {
    if (pickerMode === 'confirmed' && formConfirmedDate) return formConfirmedDate;
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
      Alert.alert('入力エラー', '企業名と進捗ステータスを入力してください。');
      return;
    }

    createCompany({
      name,
      progressStatus: progress,
      candidateDates: formCandidates,
      confirmedDate: formConfirmedDate,
      remarks: formNotes.trim() || undefined,
      nextAction: formNextAction.trim() || undefined,
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
    formNextAction,
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
            <Pressable style={styles.primaryButton} onPress={toggleForm}>
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
          ListHeaderComponent={
            isFormOpen ? (
              <ThemedView style={styles.formCard}>
                <View style={styles.formHeader}>
                  <ThemedText style={styles.formTitle}>新規企業</ThemedText>
                  <ThemedText style={styles.formLead}>
                    入力した内容は企業一覧とカレンダーに反映され、進捗管理がしやすくなります。
                  </ThemedText>
                </View>

                <ThemedText style={styles.formHeading}>基礎情報</ThemedText>
                <View style={styles.formSection}>
                  <View style={styles.inputBlock}>
                    <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={formName}
                      onChangeText={setFormName}
                    />
                  </View>
                  <View style={styles.inputBlock}>
                    <ThemedText style={styles.fieldLabel}>進捗</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={formProgress}
                      placeholder="例：選考中／結果待ち／内定 など"
                      onChangeText={setFormProgress}
                    />
                  </View>
                  <View style={styles.inputBlock}>
                    <ThemedText style={styles.fieldLabel}>メモ（任意）</ThemedText>
                    <TextInput
                      style={[styles.input, styles.multilineInput]}
                      value={formNotes}
                      onChangeText={setFormNotes}
                      multiline
                    />
                  </View>
                </View>

                <ThemedText style={styles.formHeading}>日程管理</ThemedText>
                <View style={[styles.formSection, styles.scheduleSection]}>
                  <View style={styles.inputBlock}>
                    <ThemedText style={styles.fieldLabel}>次にやること</ThemedText>
                    <TextInput
                      style={styles.input}
                      value={formNextAction}
                      onChangeText={setFormNextAction}
                      placeholder="例：一次面接の準備資料を仕上げる"
                    />
                  </View>
                  <View style={styles.scheduleHeader}>
                    <ThemedText style={styles.formLabel}>候補日・確定日</ThemedText>
                    <View style={styles.scheduleActions}>
                      <Pressable style={styles.secondaryButton} onPress={() => handlePickerOpen('candidate')}>
                        <MaterialIcons name="event" size={16} color={PRIMARY} />
                        <ThemedText style={styles.secondaryButtonLabel}>候補を追加</ThemedText>
                      </Pressable>
                      <Pressable style={styles.secondaryButton} onPress={() => handlePickerOpen('confirmed')}>
                        <MaterialIcons name="event-available" size={16} color={PRIMARY} />
                        <ThemedText style={styles.secondaryButtonLabel}>確定を設定</ThemedText>
                      </Pressable>
                    </View>
                  </View>

                  {formConfirmedDate ? (
                    <View style={styles.confirmedBlock}>
                      <ThemedText style={styles.formCaption}>確定した予定</ThemedText>
                      <ScheduleChip
                        iso={formConfirmedDate}
                        status="confirmed"
                        actions={[
                          {
                            key: 'clear',
                            label: 'クリア',
                            icon: 'close',
                            color: WARNING,
                            backgroundColor: 'rgba(245, 158, 11, 0.18)',
                            onPress: handleClearConfirmed,
                          },
                        ]}
                      />
                      {formNextAction ? (
                        <ThemedText style={styles.actionSummary}>{formNextAction}</ThemedText>
                      ) : null}
                    </View>
                  ) : null}

                  {formCandidates.length > 0 ? (
                    <View style={styles.candidateBlock}>
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
                                icon: 'delete',
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

                  {!formConfirmedDate && formCandidates.length === 0 ? (
                    <ThemedText style={styles.formHint}>
                      ������m�����o�^����Ƃ�����ɕ\������܂��B
                    </ThemedText>
                  ) : null}
                </View>

                <View style={styles.modalActions}>
                  <Pressable style={styles.modalButton} onPress={toggleForm}>
                    <ThemedText style={styles.modalButtonLabel}>キャンセル</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.modalButton, styles.modalPrimaryButton]} onPress={handleCreateCompany}>
                    <ThemedText style={styles.modalPrimaryLabel}>保存</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            ) : null
          }
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
                          ���� {candidateCount} ���o�^�ς�
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
      </View>

      <SchedulePickerModal
        visible={pickerVisible}
        status={pickerMode ?? 'candidate'}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 16,
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
  formTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
  },
  formLead: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 20,
  },
  formHeading: {
    color: TEXT_PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  formSection: {
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: SURFACE_SUBTLE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
  },
  scheduleSection: {
    gap: 18,
  },
  inputBlock: {
    width: '100%',
    gap: 6,
  },
  fieldLabel: {
    color: TEXT_PRIMARY,
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
    fontSize: 18,
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
  statusBadgeLabel: { color: PRIMARY, fontWeight: '700', fontSize: 12 },
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
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  metaValue: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  metaAction: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 12,
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
    fontSize: 12,
  },
  noteSnippet: {
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
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
  secondaryButtonLabel: { color: PRIMARY, fontWeight: '600' },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmedBlock: {
    gap: 8,
  },
  candidateBlock: {
    gap: 8,
  },
  actionSummary: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '600',
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
    gap: 12,
    marginTop: 10,
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

