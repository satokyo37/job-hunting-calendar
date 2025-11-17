import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScheduleChip } from '@/components/ScheduleChip';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import { useAppStore } from '@/store/useAppStore';

const {
  background: BACKGROUND,
  surface: SURFACE,
  surfaceSubtle: SURFACE_SUBTLE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED,
  primary: PRIMARY,
  success: SUCCESS,
} = Palette;

const formatTaskDueLabel = (iso: string) =>
  format(parseISO(iso), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", { locale: ja });

export default function CompanyDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const companyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  const companies = useAppStore((state) => state.companies);

  const company = useMemo(
    () => companies.find((candidate) => candidate.id === companyId) ?? null,
    [companies, companyId]
  );

  if (!companyId || !company) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ title: '企業詳細' }} />
        <ThemedView style={[styles.container, styles.centered]}>
          <ThemedText type="defaultSemiBold">指定された企業が見つかりませんでした。</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const hasSchedule = Boolean(company.confirmedDate) || company.candidateDates.length > 0;

  const renderSchedule = () => {
    if (!hasSchedule) {
      return <ThemedText style={styles.placeholder}>登録された予定はありません</ThemedText>;
    }

    return (
      <View style={styles.scheduleSummaryCard}>
        {company.confirmedDate ? (
          <View style={styles.confirmedBlock}>
            <ThemedText style={styles.formCaption}>確定した予定</ThemedText>
            <ScheduleChip
              iso={company.confirmedDate}
              status="confirmed"
              title={company.nextAction?.trim() || undefined}
              actionsAlign="right"
            />
          </View>
        ) : null}

        {company.candidateDates.length > 0 ? (
          <View
            style={[
              styles.candidateBlock,
              company.confirmedDate && styles.scheduleSummaryDivider,
            ]}
          >
            <ThemedText style={styles.formCaption}>候補日</ThemedText>
            <View style={styles.chipColumn}>
              {company.candidateDates.map((candidate) => (
                <ScheduleChip
                  key={candidate}
                  iso={candidate}
                  status="candidate"
                  title={company.nextAction?.trim() || undefined}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderTasks = () => {
    if (!company.tasks.length) {
      return <ThemedText style={styles.placeholder}>登録されたタスクはありません</ThemedText>;
    }

    return (
      <View style={styles.taskList}>
        {company.tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <View style={styles.taskToggle}>
              <MaterialIcons
                name={task.isDone ? 'check-circle' : 'radio-button-unchecked'}
                size={20}
                color={task.isDone ? SUCCESS : PRIMARY}
              />
            </View>
            <View style={styles.taskBody}>
              <ThemedText style={[styles.taskTitle, task.isDone && styles.taskTitleDone]}>
                {task.title}
              </ThemedText>
              {task.dueDate ? (
                <ThemedText style={styles.taskDue}>期限: {formatTaskDueLabel(task.dueDate)}</ThemedText>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: '企業詳細',
          headerRight: () => (
            <Pressable
              style={styles.headerEditLink}
              hitSlop={8}
              onPress={() => router.push(`/company/${companyId}/edit`)}
            >
              <MaterialIcons name="edit" size={18} color={PRIMARY} />
              <ThemedText style={styles.headerEditLabel}>編集</ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>基本情報</ThemedText>
          <View style={styles.readOnlyGroup}>
            <View style={styles.readOnlyField}>
              <ThemedText style={styles.fieldLabel}>企業名</ThemedText>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={company.name}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
            <View style={styles.readOnlyField}>
              <ThemedText style={styles.fieldLabel}>進捗ステータス</ThemedText>
              <TextInput
                style={[styles.input, styles.readOnlyInput]}
                value={company.progressStatus}
                editable={false}
                selectTextOnFocus={false}
              />
            </View>
            <View style={styles.readOnlyField}>
              <ThemedText style={styles.fieldLabel}>備考</ThemedText>
              <TextInput
                style={[styles.input, styles.multilineInput, styles.readOnlyInput]}
                value={company.remarks ?? ''}
                editable={false}
                multiline
                scrollEnabled={false}
                selectTextOnFocus={false}
              />
            </View>
            <View style={styles.readOnlyField}>
              <ThemedText style={styles.fieldLabel}>次のアクション</ThemedText>
              <TextInput
                style={[styles.input, styles.multilineInput, styles.readOnlyInput]}
                value={company.nextAction ?? ''}
                editable={false}
                multiline
                scrollEnabled={false}
                selectTextOnFocus={false}
              />
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>スケジュール</ThemedText>
          <View style={styles.readOnlyScheduleSection}>{renderSchedule()}</View>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              タスク
            </ThemedText>
          </View>
          {renderTasks()}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    padding: 24,
  },
  headerEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  headerEditLabel: {
    color: PRIMARY,
    fontWeight: '600',
  },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
    fontSize: 18,
    letterSpacing: 0.2,
  },
  placeholder: {
    color: TEXT_MUTED,
  },
  fieldLabel: {
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  readOnlyGroup: {
    gap: 16,
  },
  readOnlyField: {
    gap: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TEXT_PRIMARY,
    fontWeight: '600',
  },
  readOnlyInput: {
    color: TEXT_PRIMARY,
    opacity: 0.9,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  readOnlyScheduleSection: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 16,
    gap: 12,
    backgroundColor: SURFACE_SUBTLE,
  },
  scheduleSummaryCard: {
    gap: 16,
  },
  confirmedBlock: {
    gap: 10,
  },
  candidateBlock: {
    gap: 10,
  },
  scheduleSummaryDivider: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
  },
  formCaption: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  chipColumn: {
    gap: 10,
  },
  taskList: {
    gap: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: SURFACE,
  },
  taskToggle: { width: 28, alignItems: 'center' },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { color: TEXT_PRIMARY, fontWeight: '600' },
  taskTitleDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  taskDue: { color: TEXT_MUTED, fontSize: 12 },
});
