import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from '@/components/notebook/Hand';
import { fonts, handDrawnRadius, ink, onRules, RULE_SPACING } from '@/lib/notebook';

// Pen-outlined button, two ruled lines tall: the outline sits on the rules above and below
// and the label is written on the middle rule.
export function PenButton({
	label,
	onPress,
	disabled = false,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	const color = disabled ? ink.faint : ink.blue;

	return (
		<Pressable style={styles.button} onPress={onPress} disabled={disabled}>
			<View style={[styles.outline, { borderColor: color }]} />
			<Txt style={[styles.label, { color }]}>{label}</Txt>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: { height: RULE_SPACING * 2, alignItems: 'center' },
	outline: { ...StyleSheet.absoluteFillObject, ...handDrawnRadius, borderWidth: 2.5 },
	label: onRules(fonts.caveat700, 26),
});
