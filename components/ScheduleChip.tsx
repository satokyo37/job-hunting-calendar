import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

const CANDIDATE_BG = 'rgba(37, 99, 235, 0.12)';
const CONFIRMED_BG = 'rgba(22, 163, 74, 0.12)';
const CANDIDATE_ICON = '#2563EB';
const CONFIRMED_ICON = '#16A34A';
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
  status: 'candidate' | 'confirmed';
  actions?: ScheduleChipAction[];
};

const formatDisplayDate = (iso: string) =>
  format(parseISO(iso), 'M月d日（EEE） HH:mm', { locale: ja });

export function ScheduleChip({ iso, status, actions = [] }: Props) {
  const isCandidate = status === 'candidate';
  const backgroundColor = isCandidate ? CANDIDATE_BG : CONFIRMED_BG;
  const icon = isCandidate ? 'hourglass-bottom' : 'event-available';
  const iconColor = isCandidate ? CANDIDATE_ICON : CONFIRMED_ICON;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.meta}>
        <View style={[styles.iconBadge, { backgroundColor: `${iconColor}1A` }]}>
          <MaterialIcons name={icon} size={18} color={iconColor} />
        </View>
        <ThemedText style={styles.dateLabel}>{formatDisplayDate(iso)}</ThemedText>
      </View>
      {actions.length > 0 ? (
        <View style={styles.actions}>
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
