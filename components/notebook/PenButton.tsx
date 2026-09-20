import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt } from '@/components/notebook/Hand';
import { PenLoop } from '@/components/notebook/PenLoop';
import { fonts, ink, onRules, overhang, RULE_SPACING } from '@/lib/notebook';

const FONT_SIZE = 26;

// Two ruled lines tall: the label is written on the first rule and circled, the way you'd ring
// the thing you meant to come back to. The ring is a drawing rather than a border, so it goes
// round twice and stops instead of closing, and it overhangs the button into the gap above.
export function PenButton({
	label,
	onPress,
	disabled = false,
}: {
	label: string;
	onPress: () => void;
	disabled?: boolean;
}) {
	const color = disabled ? ink.faint : ink.red;
	const [word, setWord] = useState(0);
	const [room, setRoom] = useState(0);

	return (
		<Pressable
			style={styles.button}
			onPress={onPress}
			disabled={disabled}
			onLayout={(event) => setRoom(event.nativeEvent.layout.width)}>
			<View
				style={styles.word}
				onLayout={(event) => setWord(event.nativeEvent.layout.width)}>
				{/* Txt adds a trailing space so Android doesn't clip the last letter; the ring goes
				    round the letters, so that space comes back out of the width. */}
				<PenLoop
					width={word - overhang(FONT_SIZE)}
					fontFamily={fonts.caveat700}
					fontSize={FONT_SIZE}
					color={color}
					maxWidth={room || undefined}
				/>
				<Txt style={[styles.label, { color }]}>{label}</Txt>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	button: { height: RULE_SPACING * 2, alignItems: 'center' },
	// Hugs the label, so the ring is sized to the word rather than to the whole column.
	word: { alignSelf: 'center' },
	label: onRules(fonts.caveat700, FONT_SIZE),
});
