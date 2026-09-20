import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts, ink, onRules, RULE_SPACING } from '@/lib/notebook';
import { wobble } from '@/lib/pen';
import { Txt } from '@/components/notebook/Hand';

export type ScribbleBar = { label: string; value: number; valueLabel: string };

// Chart geometry, in ruled lines: bars stand on the rule at the bottom of line PLOT_LINES and the
// labels are written on the line below.
const PLOT_LINES = 4;
const BASELINE = PLOT_LINES * RULE_SPACING - 1;
const PLOT_TOP = 26; // room for the tallest bar's value above it
const AXIS_X = 4;
const BAR_FILL = 0.66; // share of each slot the bar takes
const HATCH_STEP = 12; // spacing between hatch strokes, measured along the bar's edge
const HATCH_INSET = 2.5; // keeps hatching just inside the outline

// Bar chart drawn in pen: wobbly axes, bars outlined with overshooting strokes and filled with a
// diagonal pen hatching. Seeded, so the drawing is the same every render. Six ruled lines tall, the first left blank.
export function ScribbleBars({
	bars,
	color = ink.blue,
	seed = 1,
}: {
	bars: ScribbleBar[];
	color?: string;
	seed?: number;
}) {
	const [width, setWidth] = useState(0);
	const max = Math.max(...bars.map((bar) => bar.value), 1);
	const slot = (width - AXIS_X - 6) / Math.max(bars.length, 1);
	const plotHeight = BASELINE - PLOT_TOP;

	const geometry = bars.map((bar, i) => {
		const w = slot * BAR_FILL;
		const x = AXIS_X + 6 + i * slot + (slot - w) / 2;
		const h = (bar.value / max) * plotHeight;
		return { x, w, top: BASELINE - h, h };
	});

	const w = (stroke: number, channel: number) => wobble(seed, stroke, channel);

	const axes =
		`M${AXIS_X + w(0, 0)} ${8 + w(0, 1)} C ${AXIS_X + w(0, 2)} ${BASELINE * 0.4}, ${AXIS_X - w(0, 3)} ${BASELINE * 0.7}, ${AXIS_X} ${BASELINE + 1.5} ` +
		`M${AXIS_X - 2} ${BASELINE + w(1, 0) * 0.5} C ${width * 0.35} ${BASELINE + w(1, 1)}, ${width * 0.7} ${BASELINE - w(1, 2)}, ${width - 2} ${BASELINE + w(1, 3) * 0.8}`;

	const outlines: string[] = [];
	const scribbles: string[] = [];
	geometry.forEach(({ x, w: bw, top, h }, i) => {
		const s = 10 + i * 7; // stroke seed base per bar
		if (h < 2) {
			// A zero is a short flat pen line on the baseline.
			outlines.push(
				`M${x - 1} ${BASELINE - 1.5 + w(s, 0) * 0.5} L${x + bw + 1} ${BASELINE - 1.5 + w(s, 1) * 0.5}`,
			);
			return;
		}
		// Each side is its own stroke, overshooting the corners a little like a quick sketch.
		outlines.push(
			`M${x + w(s, 0) * 0.8} ${BASELINE} L${x + w(s, 1) * 0.8} ${top - 2}`,
			`M${x - 2} ${top + w(s + 1, 0)} L${x + bw + 2} ${top + w(s + 1, 1)}`,
			`M${x + bw + w(s + 2, 0) * 0.8} ${top - 1.5} L${x + bw + w(s + 2, 1) * 0.8} ${BASELINE}`,
		);
		// Hatching: parallel strokes rising to the right, clipped to the bar. In bar coordinates
		// (u across from the left edge, v up from the base) each stroke is the line u - v = d.
		const iw = bw - HATCH_INSET * 2;
		const ih = h - HATCH_INSET * 2;
		const left = x + HATCH_INSET;
		const base = BASELINE - HATCH_INSET;
		for (let d = -ih + HATCH_STEP / 2, k = 0; d < iw; d += HATCH_STEP, k++) {
			const u0 = Math.max(0, d);
			const u1 = Math.min(iw, ih + d);
			if (u1 - u0 < 2) continue;
			const j = (channel: number) => w(s + 3, k * 4 + channel) * 0.7;
			scribbles.push(
				`M${left + u0 + j(0)} ${base - (u0 - d) + j(1)} L${left + u1 + j(2)} ${base - (u1 - d) + j(3)}`,
			);
		}
	});

	return (
		<View style={styles.chart} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
			{width > 0 && (
				<>
					<Svg width={width} height={PLOT_LINES * RULE_SPACING} style={StyleSheet.absoluteFill}>
						<Path
							d={scribbles.join(' ')}
							stroke={color}
							strokeWidth={2.2}
							strokeOpacity={0.7}
							strokeLinecap='round'
							strokeLinejoin='round'
							fill='none'
						/>
						<Path
							d={outlines.join(' ')}
							stroke={color}
							strokeWidth={2.2}
							strokeLinecap='round'
							fill='none'
						/>
						<Path d={axes} stroke={ink.ink} strokeWidth={2} strokeLinecap='round' fill='none' />
					</Svg>
					{geometry.map(({ x, w: bw, top }, i) => (
						<Txt
							key={bars[i].label}
							style={[styles.value, { left: x - 10, width: bw + 20, top: top - 26, color }]}>
							{bars[i].valueLabel}
						</Txt>
					))}
				</>
			)}
			<View style={[styles.labels, { paddingLeft: AXIS_X + 6 }]}>
				{bars.map((bar) => (
					<Txt key={bar.label} style={styles.label}>
						{bar.label}
					</Txt>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	// One blank ruled line above the plot so it doesn't crowd the heading.
	chart: { marginTop: RULE_SPACING, height: (PLOT_LINES + 1) * RULE_SPACING },
	value: {
		position: 'absolute',
		fontFamily: fonts.caveat500,
		fontSize: 18,
		lineHeight: 24,
		textAlign: 'center',
	},
	labels: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: PLOT_LINES * RULE_SPACING,
		flexDirection: 'row',
	},
	label: { flex: 1, textAlign: 'center', ...onRules(fonts.kalam300, 11), color: ink.faint },
});
