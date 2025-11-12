export const NOTO_SANS_JP = {
  regular: 'NotoSansJP_400Regular',
  medium: 'NotoSansJP_500Medium',
  semibold: 'NotoSansJP_600SemiBold',
  bold: 'NotoSansJP_700Bold',
} as const;

export type NotoSansJPFont = (typeof NOTO_SANS_JP)[keyof typeof NOTO_SANS_JP];
