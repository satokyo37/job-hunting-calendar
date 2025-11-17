import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import {
  ACTIVE_SELECTION_STATUSES,
  PROGRESS_STATUS_ITEMS,
  ProgressStatusValue,
} from '@/constants/progressStatus';
import { useAppStore } from '@/store/useAppStore';
import type { CompanySchedule, CompanyTaskItem } from '@/types/companyItems';

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

const APP_LOGO = require('@/assets/images/schetto.png');

type TodayTaskItem = CompanyTaskItem & {
  kind: 'task';
  dueDate: string;
  sortTime: number;
};

type TodayScheduleItem = CompanySchedule & {
  kind: 'schedule';
  sortTime: number;
};

type TodayItem = TodayTaskItem | TodayScheduleItem;

export default function HomeScreen() {
  const companies = useAppStore((s) => s.companies);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const removeTask = useAppStore((s) => s.removeTaskFromCompany);

  const taskItems = useMemo<CompanyTaskItem[]>(() => {
    const today = new Date();
    const todayStart = startOfDay(today);

    const items = companies
      .flatMap((c) =>
        c.tasks.map((t) => ({
          ...t,
          companyId: c.id,
          companyName: c.name,
        }))
      )
      .filter((task) => {
        if (task.isDone || !task.dueDate) return false;

        const dueDate = parseISO(task.dueDate);
        return isBefore(dueDate, todayStart) || isSameDay(dueDate, today);
      });

    return items.sort((a, b) => {
      const ad = new Date(a.dueDate!).getTime();
      const bd = new Date(b.dueDate!).getTime();
      return ad - bd;
    });
  }, [companies]);

  const scheduleItems = useMemo<CompanySchedule[]>(() => {
    const today = startOfDay(new Date());

    return companies.flatMap((company) => {
      if (!company.confirmedDate) return [];

      const confirmed = parseISO(company.confirmedDate);
      if (!isSameDay(confirmed, today)) return [];

      return [
        {
          companyId: company.id,
          companyName: company.name,
          iso: company.confirmedDate,
          scheduleType: 'confirmed' as const,
          title: company.nextAction?.trim() || undefined,
        },
      ];
    });
  }, [companies]);

  const todayItems: TodayItem[] = useMemo(() => {
    const schedules: TodayScheduleItem[] = scheduleItems.map((item) => ({
      ...item,
      kind: 'schedule' as const,
      sortTime: new Date(item.iso).getTime(),
    }));

    const tasks: TodayTaskItem[] = taskItems.map((task) => ({
      ...task,
      kind: 'task' as const,
      dueDate: task.dueDate!,
      sortTime: new Date(task.dueDate!).getTime(),
    }));

    return [...schedules, ...tasks].sort((a, b) => a.sortTime - b.sortTime);
  }, [scheduleItems, taskItems]);

  const pendingTaskCount = taskItems.length;
  const scheduleCount = scheduleItems.length;

  const progressSummary = useMemo(() => {
    const counts = PROGRESS_STATUS_ITEMS.reduce<Record<ProgressStatusValue, number>>(
      (acc, item) => {
        acc[item.value] = 0;
        return acc;
      },
      {} as Record<ProgressStatusValue, number>
    );

    companies.forEach((company) => {
      counts[company.progressStatus] = (counts[company.progressStatus] ?? 0) + 1;
    });

    const items = PROGRESS_STATUS_ITEMS.map((item) => ({
      ...item,
      count: counts[item.value] ?? 0,
    }));

    const selectionTotal = ACTIVE_SELECTION_STATUSES.reduce(
      (total, status) => total + (counts[status] ?? 0),
      0
    );

    return {
      items,
      selectionTotal,
      totalCompanies: companies.length,
    };
  }, [companies]);

  const isEmpty = todayItems.length === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.appHero}>
          <View style={styles.appHeroMain}>
            <Image source={APP_LOGO} style={styles.appHeroImage} resizeMode="contain" />
            <View>
              <ThemedText style={styles.appHeroTitle}>Schetto</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <View>
              <ThemedText style={styles.summaryTitle}>進捗サマリー</ThemedText>
              <ThemedText style={styles.summarySubtitle}>
                選考中 {progressSummary.selectionTotal} 社
              </ThemedText>
            </View>
            <View style={styles.summaryBadge}>
              <ThemedText style={styles.summaryBadgeLabel}>
                合計 {progressSummary.totalCompanies} 社
              </ThemedText>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryScroll}
          >
            {progressSummary.items.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.statusCard,
                  { borderColor: item.border },
                  index === progressSummary.items.length - 1 && styles.statusCardLast,
                ]}
              >
                <View style={styles.statusCardHeader}>
                  <View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: item.background, borderColor: item.border },
                    ]}
                  >
                    <MaterialIcons name={item.icon as any} size={16} color={item.accent} />
                  </View>
                  <View style={styles.statusCardTexts}>
                    <ThemedText style={styles.statusCardLabel}>{item.value}</ThemedText>
                    <ThemedText style={styles.statusCardCaption}>{item.description}</ThemedText>
                  </View>
                </View>
                <View style={styles.statusCardCountRow}>
                  <ThemedText style={styles.statusCardCount}>{item.count}</ThemedText>
                  <ThemedText style={styles.statusCardCountUnit}>社</ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.tasksHeader}>
          <ThemedText style={styles.tasksTitle}>今日やること</ThemedText>
          {!isEmpty && (
            <ThemedText style={styles.tasksSubtitle}>
              予定 {scheduleCount} 件 / タスク {pendingTaskCount} 件
            </ThemedText>
          )}
        </View>

        <FlatList
          style={styles.list}
          contentContainerStyle={[styles.listContent, isEmpty && styles.listEmptyContent]}
          data={todayItems}
          keyExtractor={(item) =>
            item.kind === 'task'
              ? `task-${item.id}`
              : `schedule-${item.companyId}-${item.iso}-${item.scheduleType}`
          }
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <MaterialIcons
                name="today"
                size={32}
                color={PRIMARY}
                style={{ marginBottom: 8, opacity: 0.7 }}
              />
              <ThemedText style={styles.emptyText}>今日の予定・タスクはありません</ThemedText>
              <Link href="/(tabs)/tasks" asChild>
                <Pressable style={styles.emptyButton}>
                  <MaterialIcons name="list" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.emptyButtonLabel}>タスク一覧を開く</ThemedText>
                </Pressable>
              </Link>
            </ThemedView>
          }
          renderItem={({ item }) =>
            item.kind === 'task' ? (
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
                  <Link href={`/(tabs)/companies/${item.companyId}`} asChild>
                    <Pressable>
                      <ThemedText style={styles.companyLink}>{item.companyName}</ThemedText>
                    </Pressable>
                  </Link>

                  {item.dueDate ? (
                    <ThemedText style={styles.due}>
                      {format(parseISO(item.dueDate), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", { locale: ja })}
                    </ThemedText>
                  ) : null}
                </View>

                <Pressable onPress={() => removeTask(item.companyId, item.id)} style={styles.deleteBtn}>
                  <MaterialIcons name="delete-outline" size={20} color={TEXT_MUTED} />
                </Pressable>
              </View>
            ) : (
              <View style={[styles.taskRow, styles.scheduleRow]}>
                <View style={styles.scheduleIconBadge}>
                  <MaterialIcons
                    name={item.scheduleType === 'confirmed' ? 'event-available' : 'event-note'}
                    size={18}
                    color={PRIMARY}
                  />
                </View>
                <View style={styles.taskBody}>
                  <ThemedText style={styles.taskTitle}>{item.companyName}</ThemedText>
                  {item.title ? (
                    <ThemedText style={styles.scheduleTitle} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                  ) : null}

                  <View style={styles.scheduleMetaRow}>
                    <ThemedText style={styles.scheduleLabel}>
                      {item.scheduleType === 'confirmed' ? '確定日程' : '候補日'}
                    </ThemedText>
                    <ThemedText style={styles.due}>
                      {format(parseISO(item.iso), "HH:mm '開始'", { locale: ja })}
                    </ThemedText>
                  </View>
                </View>

                <Link href={`/(tabs)/companies/${item.companyId}`} asChild>
                  <Pressable style={styles.scheduleLink}>
                    <MaterialIcons name="chevron-right" size={20} color={TEXT_MUTED} />
                  </Pressable>
                </Link>
              </View>
            )
          }
        />
      </View>
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
  appHero: {
    gap: 12,
    marginBottom: 24,
  },
  appHeroMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appHeroImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  appHeroTitle: {
    color: TEXT_PRIMARY,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  summarySection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    backgroundColor: SURFACE_SUBTLE,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: { color: TEXT_PRIMARY, fontWeight: '700', fontSize: 16 },
  summarySubtitle: { color: TEXT_MUTED, fontSize: 12, fontWeight: '600' },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  summaryBadgeLabel: { color: PRIMARY, fontWeight: '700', fontSize: 12 },
  summaryScroll: { paddingRight: 8 },
  statusCard: {
    width: 180,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: SURFACE,
    padding: 12,
    marginRight: 12,
    gap: 8,
  },
  statusCardLast: { marginRight: 0 },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusCardTexts: { flex: 1 },
  statusCardLabel: { color: TEXT_PRIMARY, fontWeight: '700', fontSize: 13 },
  statusCardCaption: { color: TEXT_MUTED, fontSize: 11, lineHeight: 14 },
  statusCardCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statusCardCount: { color: TEXT_PRIMARY, fontSize: 26, fontWeight: '700' },
  statusCardCountUnit: { color: TEXT_MUTED, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 120 },
  listEmptyContent: { flexGrow: 1, justifyContent: 'center' },
  empty: {
    backgroundColor: SURFACE_SUBTLE,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: { color: TEXT_PRIMARY, fontWeight: '600' },
  emptyButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  emptyButtonLabel: { color: '#FFFFFF', fontWeight: '700' },
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
  checkDone: {},
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { color: TEXT_PRIMARY, fontWeight: '600' },
  done: { opacity: 0.5, textDecorationLine: 'line-through' },
  companyLink: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '40%'
  },
  due: { color: TEXT_MUTED, fontSize: 11 },
  deleteBtn: { padding: 4 },
  tasksHeader: {
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  tasksTitle: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  tasksSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleRow: { alignItems: 'center', borderColor: 'rgba(37, 99, 235, 0.25)' },
  scheduleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  scheduleTitle: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: '600' },
  scheduleLabel: { color: TEXT_MUTED, fontSize: 12, fontWeight: '600' },
  scheduleLink: { padding: 4 },
  scheduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

