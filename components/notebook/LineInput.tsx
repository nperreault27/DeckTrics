import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Rule } from '@/components/notebook/RuledPaper';
import { fonts, ink, RULE_SPACING } from '@/lib/notebook';

// A text field written on one ruled line, underlined in pen blue.
export function LineInput(props: TextInputProps) {
	return (
		<View style={styles.line}>
			<TextInput
				style={styles.input}
				placeholderTextColor={ink.faint}
				autoCorrect={false}
				cursorColor={ink.blue}
				selectionColor={ink.rule}
				{...props}
			/>
			<Rule color={ink.blue} width={1.5} />
		</View>
	);
}

const styles = StyleSheet.create({
	line: { height: RULE_SPACING },
	// TextInput can't take the ruled-line baseline trick, so it is sized to the band and padded down.
	input: {
		height: RULE_SPACING,
		paddingVertical: 0,
		paddingTop: 4,
		fontFamily: fonts.caveat500,
		fontSize: 22,
		color: ink.ink,
		includeFontPadding: false,
	},
});
