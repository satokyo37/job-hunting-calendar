import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Pressable, StyleSheet, View } from 'react-native';

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

type ChipVariant = 'default' | 'subtle';

type Props = {
  iso: string;
  status: keyof typeof STATUS_PRESETS;
  title?: string;
  actions?: ScheduleChipAction[];
  actionsAlign?: 'left' | 'right';
  variant?: ChipVariant;
};

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'M月d日（EEE） HH:mm', { locale: ja });

export function ScheduleChip({
  iso,
  status,
  title,
  actions = [],
  actionsAlign = 'left',
  variant = 'default',
}: Props) {
  const { background, iconColor, icon } = STATUS_PRESETS[status];
  const hasTitle = Boolean(title && title.trim() !== '');
  const containerBackground = variant === 'subtle' ? 'rgba(148, 163, 184, 0.12)' : background;

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBadge, { backgroundColor: `${iconColor}1A` }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>

        <View style={styles.textColumn}>
          {hasTitle && (
            <ThemedText style={styles.title} numberOfLines={2}>
              {title}
            </ThemedText>
          )}

          <ThemedText
            style={[styles.dateLabel, !hasTitle && styles.dateLabelStrong]}
            numberOfLines={1}
          >
            {formatDisplayDate(iso)}
          </ThemedText>
        </View>
      </View>

      {actions.length > 0 && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  container: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  dateLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  dateLabelStrong: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
});
