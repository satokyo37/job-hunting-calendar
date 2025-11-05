import { ComponentProps, ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

type PageHeaderProps = {
  icon?: ComponentProps<typeof IconSymbol>['name'];
  iconElement?: ReactNode;
  title: string;
  subtitle?: string;
  iconColor?: string;
  iconBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  lightColor?: string;
  darkColor?: string;
  rightSlot?: ReactNode;
};

export function PageHeader({
  icon,
  iconElement,
  title,
  subtitle,
  iconColor = '#2563EB',
  iconBackgroundColor = 'rgba(37, 99, 235, 0.12)',
  style,
  titleStyle,
  subtitleStyle,
  lightColor,
  darkColor,
  rightSlot,
}: PageHeaderProps) {
  const iconNode =
    iconElement ??
    (icon ? <IconSymbol size={28} color={iconColor} name={icon} /> : null);

  return (
    <ThemedView style={[styles.container, style]} lightColor={lightColor} darkColor={darkColor}>
      <View style={styles.content}>
        {iconNode ? (
          <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>
            {iconNode}
          </View>
        ) : null}
        <View style={styles.textArea}>
          <ThemedText type="title" style={[styles.title, titleStyle]}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.subtitle, subtitleStyle]}>{subtitle}</ThemedText>
          ) : null}
        </View>
      </View>
      {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    color: '#64748B',
  },
  right: {
    marginLeft: 16,
  },
});
