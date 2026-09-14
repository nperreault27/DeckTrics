import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { themes } from '../lib/themes';
import { useThemeStore } from '@/store/useThemeStore';

export default function RootLayout() {
	const themeName = useThemeStore((state) => state.themeName);
	const theme = themes[themeName];

	return (
		<PaperProvider theme={theme}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<StatusBar style='light' />
				<Stack
					screenOptions={{
						contentStyle: { backgroundColor: theme.colors.background },
						headerStyle: { backgroundColor: theme.colors.surface },
						headerTintColor: theme.colors.onSurface,
					}}>
					<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
					<Stack.Screen name='new-game' options={{ title: 'Log a Game' }} />
					<Stack.Screen name='decks/[id]' options={{ title: 'Deck Stats' }} />
				</Stack>
			</GestureHandlerRootView>
		</PaperProvider>
	);
}
