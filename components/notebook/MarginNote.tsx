import { StyleSheet, View } from 'react-native';
import { Txt } from '@/components/notebook/Hand';
import { fonts, ink, RULE_SPACING, wrapOnRules } from '@/lib/notebook';

// A remark squeezed in after the fact: red pen, on a line of its own, indented from the entry it
// comments on.
//
// The line stays on the rules rather than tilting off them — on ruled paper the handwriting is
// what reads as hand-drawn.
export function MarginNote({
	children,
	prefix = 'note',
	gap = true,
}: {
	children?: string | null;
	// The opener, so not every note starts the same way.
	prefix?: string;
	// A blank ruled line above, to set the note off from whatever it follows.
	gap?: boolean;
}) {
	if (!children) return null;

	return (
		<>
			{gap && <View style={styles.gap} />}
			<Txt style={styles.text}>
				{prefix}: {children}
			</Txt>
		</>
	);
}

const styles = StyleSheet.create({
	gap: { height: RULE_SPACING },
	text: { ...wrapOnRules(fonts.caveat500, 18), marginLeft: 10, color: ink.red },
});
