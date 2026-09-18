import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ink, RULE_SPACING } from '@/lib/notebook';

export function RuledPaper() {
	const [height, setHeight] = useState(0);
	const count = Math.ceil(height / RULE_SPACING);

	return (
		<View
			style={styles.paper}
			pointerEvents='none'
			onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
			{Array.from({ length: count }, (_, i) => (
				<View key={i} style={[styles.line, { top: i * RULE_SPACING + RULE_SPACING - 1 }]} />
			))}
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
	paper: { ...StyleSheet.absoluteFillObject, backgroundColor: ink.paper },
	line: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: ink.rule },
	rule: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
