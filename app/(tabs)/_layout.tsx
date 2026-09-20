import { Tabs } from 'expo-router';
import { themes } from '@/lib/themes';
import { ink } from '@/lib/notebook';
import { RunningHead } from '@/components/notebook/RunningHead';
import { useThemeStore } from '@/store/useThemeStore';

export default function TabsLayout() {
	const theme = themes[useThemeStore((state) => state.themeName)];

	return (
		<Tabs
			tabBar={(props) => <RunningHead {...props} />}
			screenOptions={{
				headerShown: false,
				tabBarPosition: 'top',
				// Screens not yet moved to the notebook look keep the old theme background.
				sceneStyle: { backgroundColor: theme.colors.background },
			}}>
			<Tabs.Screen
				name='index'
				options={{ title: 'home', sceneStyle: { backgroundColor: ink.paper } }}
			/>
			<Tabs.Screen
				name='stats'
				options={{ title: 'stats', sceneStyle: { backgroundColor: ink.paper } }}
			/>
			<Tabs.Screen
				name='decks'
				options={{ title: 'decks', sceneStyle: { backgroundColor: ink.paper } }}
			/>
		</Tabs>
	);
}
