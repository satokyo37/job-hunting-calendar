import { NOTO_SANS_JP } from '@/constants/Typography';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
  NotoSansJP_600SemiBold,
  NotoSansJP_700Bold,
} from '@expo-google-fonts/noto-sans-jp';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, Platform, StyleProp, Text, TextInput, TextStyle } from 'react-native';
import 'react-native-reanimated';

const BASE = NOTO_SANS_JP.regular;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
    NotoSansJP_600SemiBold,
    NotoSansJP_700Bold,
  });

  const appliedFontRef = useRef(false);

  useEffect(() => {
    if (!loaded || appliedFontRef.current) return;
    applyDefaultFont(Text as TextLikeComponent, BASE);
    applyDefaultFont(TextInput as TextLikeComponent, BASE);
    appliedFontRef.current = true;
  }, [loaded]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const hideNavBar = async () => {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
      } catch (e) {
        console.warn('Failed to set nav bar', e);
      }
    };

    hideNavBar();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        hideNavBar();
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerTitleStyle: { fontFamily: NOTO_SANS_JP.semibold },
          headerBackTitleStyle: { fontFamily: NOTO_SANS_JP.medium },
          headerLargeTitleStyle: { fontFamily: NOTO_SANS_JP.bold },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

type TextLikeComponent = {
  defaultProps?: { style?: StyleProp<TextStyle> };
};

const appendFont = (
  existing: StyleProp<TextStyle> | undefined,
  addition: TextStyle,
): StyleProp<TextStyle> => {
  if (Array.isArray(existing)) return [...existing, addition];
  if (existing) return [existing, addition];
  return addition;
};

const applyDefaultFont = (component: TextLikeComponent, font: string) => {
  component.defaultProps = component.defaultProps ?? {};
  component.defaultProps.style = appendFont(component.defaultProps.style, { fontFamily: font });
};
