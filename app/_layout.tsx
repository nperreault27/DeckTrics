import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { useFonts, Caveat_500Medium, Caveat_600SemiBold, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Kalam_300Light, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { themes } from '../lib/themes';
import { ink } from '@/lib/notebook';
import { useThemeStore } from '@/store/useThemeStore';

export default function RootLayout() {
	const themeName = useThemeStore((state) => state.themeName);
	const theme = themes[themeName];
	const [fontsLoaded] = useFonts({
		Caveat_500Medium,
		Caveat_600SemiBold,
		Caveat_700Bold,
		Kalam_300Light,
		Kalam_700Bold,
	});

	if (!fontsLoaded) {
		return null;
	}

	return (
		<PaperProvider theme={theme}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack
					screenOptions={{
						contentStyle: { backgroundColor: theme.colors.background },
						headerStyle: { backgroundColor: theme.colors.surface },
						headerTintColor: theme.colors.onSurface,
						statusBarStyle: 'light',
					}}>
					<Stack.Screen name='(tabs)' options={{ headerShown: false, statusBarStyle: 'dark' }} />
					<Stack.Screen
						name='new-game'
						options={{ headerShown: false, statusBarStyle: 'dark', contentStyle: { backgroundColor: ink.paper } }}
					/>
					<Stack.Screen
						name='decks/[id]'
						options={{ headerShown: false, statusBarStyle: 'dark', contentStyle: { backgroundColor: ink.paper } }}
					/>
				</Stack>
			</GestureHandlerRootView>
		</PaperProvider>
	);
}
