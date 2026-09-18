import { StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';

// Layout props that size and place the text in its parent; they go on the wrapper so the text
// can fill it (textAlign, numberOfLines etc. keep working).
const CONTAINER_KEYS = [
	'flex',
	'flexGrow',
	'flexShrink',
	'flexBasis',
	'width',
	'minWidth',
	'maxWidth',
	'alignSelf',
	'position',
	'top',
	'left',
	'right',
	'bottom',
	'zIndex',
] as const;

// Text for the hand-lettered fonts. The trailing space gives the last letter's overhang room so
// Android doesn't clip it.
//
// onRules() makes each text box reach a full ruled line above and below its layout slot (so
// glyphs aren't clipped). That invisible overhang would steal taps from whatever it covers, e.g.
// a picker option swallowing taps on the search box above it, and Android ignores pointerEvents
// on Text itself. So the text sits in a touch-transparent View: taps go to the Pressable around
// it, or to whatever is actually under the overhang.
export function Txt({ children, style, ...props }: TextProps) {
	const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;
	const container: ViewStyle = {};
	const text: TextStyle = { ...flat };
	for (const key of CONTAINER_KEYS) {
		if (key in flat) {
			(container as Record<string, unknown>)[key] = flat[key];
			delete (text as Record<string, unknown>)[key];
		}
	}

	return (
		<View pointerEvents='none' style={container}>
			<Text style={text} {...props}>
				{children}{' '}
			</Text>
		</View>
	);
}
