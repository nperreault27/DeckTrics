import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Txt } from '@/components/notebook/Hand';
import { fonts, ink, screenPadding } from '@/lib/notebook';

export function RunningHead({ state, descriptors, navigation }: BottomTabBarProps) {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.head, { paddingTop: insets.top + 14 }]}>
			<View style={styles.masthead}>
				<Txt style={styles.title}>DeckTrics</Txt>
				<Txt style={styles.notebookNo}>notebook no. 3</Txt>
			</View>
			<View style={styles.sections}>
				{state.routes.map((route, index) => {
					const focused = state.index === index;
					const label = descriptors[route.key].options.title ?? route.name;

					const onPress = () => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});
						if (!focused && !event.defaultPrevented) {
							navigation.navigate(route.name, route.params);
						}
					};

					return (
						<Pressable
							key={route.key}
							onPress={onPress}
							accessibilityRole='tab'
							accessibilityState={{ selected: focused }}
							style={[styles.section, focused && styles.sectionActive]}>
							<Txt style={[styles.sectionText, focused && styles.sectionTextActive]}>{label}</Txt>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	head: {
		...screenPadding,
		backgroundColor: ink.paper,
		borderBottomWidth: 2,
		borderBottomColor: ink.margin,
	},
	masthead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
	title: { fontFamily: fonts.caveat700, fontSize: 34, color: ink.blue },
	notebookNo: { fontFamily: fonts.kalam300, fontSize: 13, color: ink.tan },
	sections: { flexDirection: 'row', gap: 22, marginTop: 2, paddingBottom: 8 },
	section: { borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
	sectionActive: { borderBottomColor: ink.blue },
	sectionText: { fontFamily: fonts.caveat500, fontSize: 25, color: ink.faint },
	sectionTextActive: { fontFamily: fonts.caveat700, color: ink.blue },
});
