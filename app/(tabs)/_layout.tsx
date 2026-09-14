import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { themes } from '@/lib/themes';
import { ThemePicker } from '@/components/ThemePicker';
import { useThemeStore } from '@/store/useThemeStore';
import { Pressable, StyleSheet } from 'react-native';

export default function TabsLayout() {
	const theme = themes[useThemeStore((state) => state.themeName)];

	return (
		<Tabs
			screenOptions={{
				tabBarButton: (props) => {
					const { ref: _ref, style, ...buttonProps } = props;
					const selected = props['aria-selected'];

					return (
						<Pressable
							{...buttonProps}
							style={[
								styles.tabButton,
								style,
								{ borderTopColor: selected ? theme.colors.primary : theme.colors.outline },
							]}>
							{props.children}
						</Pressable>
					);
				},

				headerRight: () => <ThemePicker />,
				headerStyle: { backgroundColor: theme.colors.background, elevation: 0 },
				headerTintColor: theme.colors.onSurface,
				sceneStyle: { backgroundColor: theme.colors.background },
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.tertiary,
				tabBarLabelStyle: { fontSize: 12, marginBottom: 2 },
				tabBarStyle: {
					height: 96,
					paddingTop: 0,
					paddingBottom: 8,
					backgroundColor: theme.colors.surface,
					borderTopColor: theme.colors.background,
				},
			}}>
			<Tabs.Screen
				name='index'
				options={{
					title: 'HOME',
					tabBarIcon: ({ color, size }) => <Ionicons name='home-sharp' color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name='stats'
				options={{
					title: 'STATS',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name='stats-chart-sharp' color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name='decks'
				options={{
					title: 'DECKS',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name='layers-sharp' color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	tabButton: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderTopWidth: 3,
		borderTopColor: 'transparent',
	},
});
