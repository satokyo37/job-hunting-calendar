import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '@/components/PageHeader';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND = '#EFF6FF';
const SURFACE = '#FFFFFF';
const BORDER = '#D9E6FF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_MUTED = '#64748B';
const PRIMARY = '#2563EB';
const SUCCESS = '#22C55E';

export default function TasksHomeScreen() {
  const companies = useAppStore((s) => s.companies);
  const toggleTaskDone = useAppStore((s) => s.toggleTaskDone);
  const removeTask = useAppStore((s) => s.removeTaskFromCompany);

  const tasks = useMemo(() => {
    const items = companies.flatMap((c) =>
      c.tasks.map((t) => ({
        ...t,
        companyId: c.id,
        companyName: c.name,
      }))
    );
    return items.sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return ad - bd;
    });
  }, [companies]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PageHeader
          icon="calendar"
          title="就活カレンダー"
          subtitle="タスク管理"
          iconColor={PRIMARY}
          iconBackgroundColor="rgba(37, 99, 235, 0.18)"
          style={styles.pageHeader}
          titleStyle={styles.pageHeaderTitle}
          subtitleStyle={styles.pageHeaderSubtitle}
        />

        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={tasks}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText style={styles.emptyText}>登録されているタスクはありません</ThemedText>
              <ThemedText style={styles.emptyHint}>企業詳細ページの「タスク」欄から追加できます</ThemedText>
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
                      {format(parseISO(item.dueDate), "yyyy'年'MM'月'dd'日'(EEE) HH:mm", { locale: ja })}
                    </ThemedText>
                  ) : null}
                </View>
              </View>

              <Pressable onPress={() => removeTask(item.companyId, item.id)} style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={20} color={TEXT_MUTED} />
              </Pressable>
            </View>
          )}
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
  pageHeader: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 28,
  },
  pageHeaderTitle: { color: TEXT_PRIMARY, fontSize: 24, lineHeight: 30, fontWeight: '400' },
  pageHeaderSubtitle: { color: TEXT_MUTED },
  list: { flex: 1 },
  listContent: { gap: 12, paddingBottom: 120 },
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
  emptyHint: { color: TEXT_MUTED, fontSize: 12 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  companyLink: { color: PRIMARY, fontSize: 12, fontWeight: '600' },
  due: { color: TEXT_MUTED, fontSize: 12 },
  deleteBtn: { padding: 4 },
});
