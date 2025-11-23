import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/PageHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Palette } from '@/constants/Palette';
import {
  ACTIVE_SELECTION_STATUSES,
  PROGRESS_STATUS_ITEMS,
  ProgressStatusValue,
} from '@/constants/progressStatus';
import { useAppStore } from '@/store/useAppStore';
import { homeStyles as styles } from '@/styles/homeStyles';
import type { CompanySchedule, CompanyTaskItem } from '@/types/companyItems';

const { textMuted: TEXT_MUTED, primary: PRIMARY, success: SUCCESS } = Palette;

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
        })),
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
      {} as Record<ProgressStatusValue, number>,
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
      0,
    );

    return {
      items,
      selectionTotal,
      totalCompanies: companies.length,
    };
  }, [companies]);

  const isEmpty = todayItems.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <PageHeader
          iconElement={<Image source={APP_LOGO} style={styles.appHeroIcon} resizeMode="contain" />}
          title="Schetto"
          titleStyle={styles.pageHeaderTitle}
          style={styles.appHero}
        />

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
                      {
                        backgroundColor: item.background,
                        borderColor: item.border,
                      },
                    ]}
                  >
                    <MaterialIcons name={item.icon as any} size={16} color={item.accent} />
                  </View>
                  <View style={styles.statusCardTexts}>
                    <ThemedText style={styles.statusCardLabel}>{item.value}</ThemedText>
                    <View style={styles.statusCardCaptionContainer}>
                      <ThemedText
                        style={styles.statusCardCaption}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                      >
                        {item.description}
                      </ThemedText>
                    </View>
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
              <View style={styles.emptyButtonStack}>
                <Link href="/(tabs)/tasks" asChild>
                  <Pressable style={styles.emptyButton}>
                    <MaterialIcons name="list" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.emptyButtonLabel}>タスク一覧を開く</ThemedText>
                  </Pressable>
                </Link>
                <Link href="/(tabs)/calendar" asChild>
                  <Pressable style={styles.emptyButton}>
                    <MaterialIcons name="event-note" size={16} color="#FFFFFF" />
                    <ThemedText style={styles.emptyButtonLabel}>カレンダーを見る</ThemedText>
                  </Pressable>
                </Link>
              </View>
            </ThemedView>
          }
          renderItem={({ item }) =>
            item.kind === 'task' ? (
              <View style={styles.taskRow}>
                <Pressable
                  onPress={() => toggleTaskDone(item.companyId, item.id)}
                  style={styles.check}
                >
                  <MaterialIcons
                    name={item.isDone ? 'check-circle' : 'radio-button-unchecked'}
                    size={20}
                    color={item.isDone ? SUCCESS : PRIMARY}
                  />
                </Pressable>

                <View style={styles.taskBody}>
                  <View style={styles.taskTopRow}>
                    <ThemedText
                      style={[styles.taskTitle, item.isDone && styles.done]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </ThemedText>

                    {item.dueDate ? (
                      <ThemedText style={styles.due}>
                        {format(parseISO(item.dueDate), 'M/d(EEE) HH:mm', {
                          locale: ja,
                        })}
                      </ThemedText>
                    ) : null}
                  </View>

                  <View style={styles.taskBottomRow}>
                    <Link href={`/(tabs)/companies/${item.companyId}`} asChild>
                      <Pressable>
                        <ThemedText style={styles.companyLink}>{item.companyName}</ThemedText>
                      </Pressable>
                    </Link>

                    <Pressable
                      onPress={() => removeTask(item.companyId, item.id)}
                      style={styles.deleteBtn}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={TEXT_MUTED} />
                    </Pressable>
                  </View>
                </View>
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
                      {format(parseISO(item.iso), "HH:mm '開始'", {
                        locale: ja,
                      })}
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
