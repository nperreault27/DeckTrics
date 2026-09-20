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

// Smaller variant for chips and small boxes.
export const handDrawnRadiusSmall = {
	borderTopLeftRadius: 13,
	borderTopRightRadius: 8,
	borderBottomRightRadius: 15,
	borderBottomLeftRadius: 7,
};

export const screenPadding = { paddingLeft: 26, paddingRight: 20 };

// Vertical font metrics (hhea, as a fraction of font size) from the bundled TTFs.
const METRICS = {
	caveat: { ascent: 0.96, descent: 0.3, capHeight: 0.61 },
	kalam: { ascent: 1.063, descent: 0.531, capHeight: 0.73 },
};

// Gap between the rule above and the tops of capitals, for text that hangs from the rule.
const HANG_GAP = 3;

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
	return ruledText(fontFamily, fontSize, lines * RULE_SPACING - 1 - BASELINE_LIFT, lines);
}

// Like onRules, but the text hangs from the rule at the top of its line instead of resting on
// the one below: for small secondary text tucked right under the line above it.
export function hangOnRules(fontFamily: string, fontSize: number) {
	const { capHeight } = fontFamily.startsWith('Caveat') ? METRICS.caveat : METRICS.kalam;
	return ruledText(fontFamily, fontSize, HANG_GAP + Math.round(capHeight * fontSize), 1);
}

// Shared by onRules/hangOnRules: puts the baseline `target` px below the top of a `lines`-tall slot.
function ruledText(fontFamily: string, fontSize: number, target: number, lines: number) {
	const { ascent, descent } = fontFamily.startsWith('Caveat') ? METRICS.caveat : METRICS.kalam;
	const bleed = RULE_SPACING;
	const lineHeight = lines * RULE_SPACING + bleed * 2;
	const baseline = (lineHeight - (ascent + descent) * fontSize) / 2 + ascent * fontSize;
	const shift = Math.round(bleed + target - baseline);

	return {
		fontFamily,
		fontSize,
		lineHeight,
		marginTop: -bleed + shift,
		marginBottom: -bleed - shift,
	};
}

// Like onRules, but for text that may wrap: one ruled line per line of text, each baseline on
// its own rule. Skips the bleed (which would space wrapped lines three rules apart), so it only
// suits sizes whose glyphs fit inside one line, roughly fontSize <= 25.
export function wrapOnRules(fontFamily: string, fontSize: number) {
	const { ascent, descent } = fontFamily.startsWith('Caveat') ? METRICS.caveat : METRICS.kalam;
	const baseline = (RULE_SPACING - (ascent + descent) * fontSize) / 2 + ascent * fontSize;
	const shift = Math.round(RULE_SPACING - 1 - BASELINE_LIFT - baseline);

	return { fontFamily, fontSize, lineHeight: RULE_SPACING, marginTop: shift, marginBottom: -shift };
}

export const labelText = {
	...onRules(fonts.kalam700, 12),
	letterSpacing: 1.8,
	textTransform: 'uppercase' as const,
	color: ink.tan,
};
