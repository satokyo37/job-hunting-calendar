/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Primary brand tint (business-like, calm blue)
const tintColorLight = '#2563EB';
const tintColorDark = '#FFFFFF';

export const Colors = {
  light: {
    text: '#11181C',
    // Overall page background: pale blue + white surfaces
    background: '#EFF6FF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Optional extended tokens (used ad-hoc in components)
    surface: '#FFFFFF',
    surfaceSubtle: '#F8FAFF',
    border: '#D9E6FF',
    textMuted: '#64748B',
    // Status colors (pastel, business-like)
    status: {
      offer: { fg: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)' }, // 緑 内定
      inProgress: { fg: '#2563EB', bg: 'rgba(37, 99, 235, 0.12)' }, // 青 選考中
      pending: { fg: '#D97706', bg: 'rgba(245, 158, 11, 0.16)' }, // 黄 結果待ち（視認性重視で少し濃いめの文字色）
      rejected: { fg: '#F87171', bg: 'rgba(248, 113, 113, 0.18)' }, // 赤 落選（パステル寄り）
    },
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    surface: '#181B1F',
    surfaceSubtle: '#0F141A',
    border: '#273142',
    textMuted: '#A0A8B0',
    status: {
      offer: { fg: '#34D399', bg: 'rgba(52, 211, 153, 0.16)' },
      inProgress: { fg: '#60A5FA', bg: 'rgba(96, 165, 250, 0.16)' },
      pending: { fg: '#FBBF24', bg: 'rgba(251, 191, 36, 0.18)' },
      rejected: { fg: '#FCA5A5', bg: 'rgba(252, 165, 165, 0.2)' },
    },
  },
};
