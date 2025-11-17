import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

const STATUS_PRESETS = {
  candidate: {
    background: 'rgba(37, 99, 235, 0.12)',
    iconColor: '#2563EB',
    icon: 'hourglass-bottom' as const,
  },
  confirmed: {
    background: 'rgba(34, 197, 94, 0.12)',
    iconColor: '#22C55E',
    icon: 'event-available' as const,
  },
  task: {
    background: 'rgba(37, 99, 235, 0.12)',
    iconColor: '#2563EB',
    icon: 'hourglass-bottom' as const,
  },
};
const BORDER = 'rgba(148, 163, 184, 0.24)';

export type ScheduleChipAction = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  backgroundColor: string;
  onPress: () => void;
};

type Props = {
  iso: string;
  status: keyof typeof STATUS_PRESETS;
  title?: string;
  actions?: ScheduleChipAction[];
  actionsAlign?: 'left' | 'right';
};

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'M月d日（EEE） HH:mm', { locale: ja });

export function ScheduleChip({
  iso,
  status,
  title,
  actions = [],
  actionsAlign = 'left',
}: Props) {
  const { background, iconColor, icon } = STATUS_PRESETS[status];

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={styles.meta}>
        <View style={[styles.iconBadge, { backgroundColor: `${iconColor}1A` }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <ThemedText style={styles.dateLabel}>{formatDisplayDate(iso)}</ThemedText>
      </View>
      {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
      {actions.length > 0 ? (
        <View
          style={[
            styles.actions,
            actionsAlign === 'right' ? styles.actionsRight : styles.actionsLeft,
          ]}
        >
          {actions.map((action) => (
            <Pressable
              key={action.key}
              style={[styles.actionButton, { backgroundColor: action.backgroundColor }]}
              onPress={action.onPress}
            >
              <MaterialIcons name={action.icon} size={14} color={action.color} />
              <ThemedText style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    color: '#0F172A',
    fontWeight: '700',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    color: '#0F172A',
    fontWeight: '600',
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-start',
  },
  actionsLeft: {},
  actionsRight: {
    justifyContent: 'flex-end',
    width: '100%',
    alignSelf: 'stretch',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  actionLabel: {
    fontWeight: '600',
    fontSize: 12,
  },
});
