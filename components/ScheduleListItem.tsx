import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Palette } from '@/constants/Palette';
import { NOTO_SANS_JP } from '@/constants/Typography';
import type { CompanySchedule } from '@/types/companyItems';

const { primary: PRIMARY, textMuted: TEXT_MUTED, surface: SURFACE } = Palette;

export type ScheduleListItemProps = {
  schedule: Pick<CompanySchedule, 'companyId' | 'companyName' | 'iso' | 'scheduleType' | 'title'>;
  companyHref: Href;
};

export function ScheduleListItem({ schedule, companyHref }: ScheduleListItemProps) {
  return (
    <View style={[styles.taskRow, styles.scheduleRow]}>
      <View style={styles.scheduleIconBadge}>
        <MaterialIcons
          name={schedule.scheduleType === 'confirmed' ? 'event-available' : 'event-note'}
          size={18}
          color={PRIMARY}
        />
      </View>

      <View style={styles.taskContent}>
        <View style={styles.taskMain}>
          <ThemedText style={styles.taskTitle} numberOfLines={1}>
            {schedule.title || '未設定の予定'}
          </ThemedText>

          <Link href={companyHref} asChild>
            <Pressable>
              <ThemedText style={styles.companyLink}>{schedule.companyName}</ThemedText>
            </Pressable>
          </Link>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={styles.due}>
            {format(parseISO(schedule.iso), "M/d(EEE) HH:mm'", { locale: ja })}
          </ThemedText>

          <Link href={companyHref} asChild>
            <Pressable style={styles.scheduleLink}>
              <MaterialIcons name="chevron-right" size={20} color={TEXT_MUTED} />
            </Pressable>
          </Link>
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
    borderColor: 'rgba(148, 163, 184, 0.28)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  scheduleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
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
  scheduleLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    borderRadius: 12,
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  scheduleRow: {
    borderColor: 'rgba(37, 99, 235, 0.28)',
  },
});
