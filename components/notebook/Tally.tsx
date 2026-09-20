import Svg, { Path } from 'react-native-svg';
import { ink, RULE_SPACING } from '@/lib/notebook';
import { wobble } from '@/lib/pen';

const STROKE_GAP = 6;
const GROUP_GAP = 10;
const TOP = 9;
// Strokes end on the rule, like the text baselines.
const BOTTOM = RULE_SPACING - 3;

// Tally marks for a count: groups of four strokes crossed by a diagonal. One ruled line tall.
// Each stroke gets a small seeded wobble so it reads as hand-drawn but stays put between renders;
// give different rows different seeds so they don't look copy-pasted.
export function Tally({ count, color = ink.ink, seed = 1 }: { count: number; color?: string; seed?: number }) {
	const groupWidth = STROKE_GAP * 3;
	const strokes: string[] = [];

	for (let i = 0; i < count; i++) {
		const group = Math.floor(i / 5);
		const x0 = group * (groupWidth + GROUP_GAP);
		const w = (channel: number) => wobble(seed, i, channel);

		if (i % 5 === 4) {
			strokes.push(
				`M${x0 - 4 + w(0)} ${BOTTOM - 3 + w(1) * 1.5} L${x0 + groupWidth + 4 + w(2)} ${TOP + 4 + w(3) * 1.5}`,
			);
		} else {
			const x = x0 + (i % 5) * STROKE_GAP + w(0) * 0.6;
			const lean = w(1) * 1.2;
			strokes.push(`M${x + lean} ${TOP + w(2) * 1.5} L${x - lean} ${BOTTOM + w(3) * 0.8}`);
		}
	}

	const groups = Math.ceil(count / 5);
	const width = Math.max(groups * (groupWidth + GROUP_GAP), 1) + 4;

	return (
		<Svg width={width} height={RULE_SPACING} style={{ marginLeft: 4 }}>
			<Path
				d={strokes.join(' ')}
				stroke={color}
				strokeWidth={2.2}
				strokeLinecap='round'
				fill='none'
				transform='translate(4 0)'
			/>
		</Svg>
	);
}
