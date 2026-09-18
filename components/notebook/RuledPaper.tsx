import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ink, RULE_SPACING } from '@/lib/notebook';

// `margin` adds the notebook's red vertical margin line down the left edge.
//
// Normally goes inside a scroll view's content so the lines scroll with the page. For lists that
// can't host it (e.g. the drag list), put it behind the list and pass the list's `scrollOffset`:
// the lines repeat every RULE_SPACING, so shifting them by the offset mod RULE_SPACING matches
// paper that scrolls.
export function RuledPaper({ margin = false, scrollOffset }: { margin?: boolean; scrollOffset?: number }) {
	const [height, setHeight] = useState(0);
	const shift = scrollOffset === undefined ? 0 : ((scrollOffset % RULE_SPACING) + RULE_SPACING) % RULE_SPACING;
	const count = Math.ceil(height / RULE_SPACING) + (scrollOffset === undefined ? 0 : 1);

	return (
		<View
			style={styles.paper}
			pointerEvents='none'
			onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
			{Array.from({ length: count }, (_, i) => (
				<View key={i} style={[styles.line, { top: i * RULE_SPACING + RULE_SPACING - 1 - shift }]} />
			))}
			{margin && <View style={styles.marginLine} />}
		</View>
	);
}

// A heavier pen rule laid over the paper line at the bottom of its parent band.
export function Rule({ color = ink.rule, width = 2 }: { color?: string; width?: number }) {
	return (
		<View style={[styles.rule, { height: width, backgroundColor: color }]} pointerEvents='none' />
	);
}

const styles = StyleSheet.create({
	paper: { ...StyleSheet.absoluteFillObject, backgroundColor: ink.paper, overflow: 'hidden' },
	line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: ink.rule },
	rule: { position: 'absolute', left: 0, right: 0, bottom: 0 },
	marginLine: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 14,
		width: 1.5,
		backgroundColor: ink.margin,
	},
});
