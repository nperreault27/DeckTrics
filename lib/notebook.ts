// Design tokens for the "Notebook" UI. See docs/UI_SPEC.md.

export const ink = {
	desk: '#e8e2d4',
	paper: '#fdfaf0',
	rule: '#cfd9e8',
	ink: '#22304a',
	blue: '#26418f',
	red: '#b2493d',
	tan: '#7a6a52',
	body: '#4a4132',
	faint: '#8a8478',
	margin: '#d9b4ad',
};

// Custom fonts in RN are selected by family name, not fontWeight.
export const fonts = {
	caveat500: 'Caveat_500Medium',
	caveat600: 'Caveat_600SemiBold',
	caveat700: 'Caveat_700Bold',
	kalam300: 'Kalam_300Light',
	kalam700: 'Kalam_700Bold',
};

export const RULE_SPACING = 32;

// Every corner different so borders read as hand-drawn.
export const handDrawnRadius = {
	borderTopLeftRadius: 18,
	borderTopRightRadius: 12,
	borderBottomRightRadius: 20,
	borderBottomLeftRadius: 11,
};

export const screenPadding = { paddingLeft: 26, paddingRight: 20 };

// Vertical font metrics (hhea, as a fraction of font size) from the bundled TTFs.
const METRICS = {
	caveat: { ascent: 0.96, descent: 0.3 },
	kalam: { ascent: 1.063, descent: 0.531 },
};

const BASELINE_LIFT = 2;

// Approximate width of the trailing space <Hand> adds to keep letters from being clipped,
// for taking that space back out of fixed columns and gaps.
export const overhang = (fontSize: number) => Math.ceil(fontSize * 0.25);

// Text style where each line of text is `lines` ruled lines tall, with its baseline resting on
// the bottom rule. Wrap in a container whose top edge sits on a line boundary (a multiple of
// RULE_SPACING). Meant for single-line text.
//
// Android clips glyphs to the text box, and a band is shorter than the fonts' ascent + descent,
// so the box is drawn a full band taller above and below, with negative margins cancelling that
// out of the layout. The line box centres the glyphs, so the margins also shift it to land the
// baseline on the rule.
export function onRules(fontFamily: string, fontSize: number, lines = 1) {
	const { ascent, descent } = fontFamily.startsWith('Caveat') ? METRICS.caveat : METRICS.kalam;
	const bleed = RULE_SPACING;
	const lineHeight = lines * RULE_SPACING + bleed * 2;
	const baseline = (lineHeight - (ascent + descent) * fontSize) / 2 + ascent * fontSize;
	const target = bleed + lines * RULE_SPACING - 1 - BASELINE_LIFT;
	const shift = Math.round(target - baseline);

	return {
		fontFamily,
		fontSize,
		lineHeight,
		marginTop: -bleed + shift,
		marginBottom: -bleed - shift,
	};
}

export const labelText = {
	...onRules(fonts.kalam700, 12),
	letterSpacing: 1.8,
	textTransform: 'uppercase' as const,
	color: ink.tan,
};
