import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/notebook/Hand';
import { ChevronLeft } from '@/components/notebook/PenIcons';
import { fonts, ink, labelText, screenPadding } from '@/lib/notebook';

// Header for pages pushed over the tabs: a back arrow, a small label, and optional pen text on
// the right (e.g. "1 of 3"). An optional title and subtitle are written beneath, above the rule.
export function PageHead({
	label,
	right,
	title,
	subtitle,
	onBack,
}: {
	label: string;
	right?: string;
	title?: string;
	subtitle?: string;
	onBack: () => void;
}) {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.head, { paddingTop: insets.top + 10 }]}>
			<View style={styles.topRow}>
				<Pressable style={styles.back} onPress={onBack} hitSlop={12} accessibilityLabel='Back'>
					<ChevronLeft />
					<Txt style={styles.label}>{label}</Txt>
				</Pressable>
				{right && <Txt style={styles.right}>{right}</Txt>}
			</View>
			{!!title && (
				<Txt style={styles.title} numberOfLines={1}>
					{title}
				</Txt>
			)}
			{!!subtitle && (
				<Txt style={styles.subtitle} numberOfLines={1}>
					{subtitle}
				</Txt>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	head: {
		...screenPadding,
		paddingLeft: 18,
		paddingBottom: 6,
		backgroundColor: ink.paper,
		borderBottomWidth: 2,
		borderBottomColor: ink.margin,
	},
	topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	back: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	// labelText is built for the ruled grid; the header isn't ruled, so drop its baseline margins.
	label: { ...labelText, marginTop: 0, marginBottom: 0, lineHeight: 20 },
	right: { fontFamily: fonts.caveat500, fontSize: 20, color: ink.blue },
	title: { fontFamily: fonts.caveat700, fontSize: 32, lineHeight: 40, color: ink.blue, marginTop: 4 },
	subtitle: { fontFamily: fonts.kalam300, fontSize: 13, lineHeight: 20, color: ink.body, marginBottom: 2 },
});
