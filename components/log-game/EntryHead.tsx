import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/notebook/Hand';
import { ChevronLeft } from '@/components/notebook/PenIcons';
import { fonts, ink, labelText, screenPadding } from '@/lib/notebook';

// Header for the log-a-game flow: back, what stage this is, and "n of 3".
export function EntryHead({
	label,
	step,
	steps,
	onBack,
}: {
	label: string;
	step: number;
	steps: number;
	onBack: () => void;
}) {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.head, { paddingTop: insets.top + 10 }]}>
			<Pressable style={styles.back} onPress={onBack} hitSlop={12} accessibilityLabel='Back'>
				<ChevronLeft />
				<Txt style={styles.label}>{label}</Txt>
			</Pressable>
			<Txt style={styles.step}>
				{step} of {steps}
			</Txt>
		</View>
	);
}

const styles = StyleSheet.create({
	head: {
		...screenPadding,
		paddingLeft: 18,
		paddingBottom: 6,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: ink.paper,
		borderBottomWidth: 2,
		borderBottomColor: ink.margin,
	},
	back: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	// labelText is built for the ruled grid; the header isn't ruled, so drop its baseline margins.
	label: { ...labelText, marginTop: 0, marginBottom: 0, lineHeight: 20 },
	step: { fontFamily: fonts.caveat500, fontSize: 20, color: ink.blue },
});
