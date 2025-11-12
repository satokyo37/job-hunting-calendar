import { StyleSheet, Text, type TextProps } from 'react-native';

import { NOTO_SANS_JP } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const FONT_REGULAR = NOTO_SANS_JP.regular;
const FONT_SEMIBOLD = NOTO_SANS_JP.semibold;
const FONT_BOLD = NOTO_SANS_JP.bold;

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_SEMIBOLD,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_SEMIBOLD,
  },
  title: {
    fontSize: 32,
    lineHeight: 32,
    fontFamily: FONT_BOLD,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: FONT_BOLD,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    fontFamily: FONT_REGULAR,
  },
});
