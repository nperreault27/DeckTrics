import { StyleSheet, View } from 'react-native';
import { Txt } from '@/components/notebook/Hand';
import { Rule } from '@/components/notebook/RuledPaper';
import { fonts, ink, onRules } from '@/lib/notebook';

// Section heading underlined in pen, the underline laid on the ruled line. One ruled line tall.
export function SectionTitle({
	children,
	color = ink.ink,
	size = 28,
	underline = true,
}: {
	children: string;
	color?: string;
	size?: number;
	underline?: boolean;
}) {
	return (
		<View style={styles.wrap}>
			<Txt style={[onRules(fonts.caveat600, size), { color }]} numberOfLines={1}>
				{children}
			</Txt>
			{underline && <Rule color={color} />}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { alignSelf: 'flex-start' },
});
