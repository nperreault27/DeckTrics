import { StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { glyphBand } from '@/lib/notebook';
import { LOOP_FIT, loopSvg } from '@/lib/pen';

// A word circled in pen, drawn around whatever it's laid over.
//
// Sized from the letters rather than from their line box, and sized generously: the loop's second
// lap cuts across the inside, so the clear space is a lens, and a ring only a little taller than
// the writing would cross it. LOOP_FIT holds the proportions where the letters sit clear.
//
// Absolutely positioned, so it belongs inside a container that hugs the word — the ring is wider
// and taller than what it circles, and overhangs it on every side.
export function PenLoop({
	width: word,
	fontFamily,
	fontSize,
	color,
	gap = 3,
	maxWidth,
}: {
	// Width of the letters themselves, with any trailing space already taken out.
	width: number;
	fontFamily: string;
	fontSize: number;
	color: string;
	// Clear air wanted between the letters and the line.
	gap?: number;
	// Caps how wide the ring may get, for a long label in a narrow column. The letters end up
	// closer to the line than `gap` asks, which still beats drawing off the side of the screen.
	maxWidth?: number;
}) {
	if (word <= 0) return null;

	const band = glyphBand(fontFamily, fontSize);
	const height = (band.bottom - band.top) * LOOP_FIT.height;
	const wanted = (word + gap * 2) / LOOP_FIT.width;
	const width = maxWidth ? Math.min(wanted, maxWidth) : wanted;

	return (
		<Svg
			width={width}
			height={height}
			viewBox={loopSvg.viewBox}
			// The artwork is a fixed shape; letting it stretch is what makes it fit a wide label.
			preserveAspectRatio='none'
			pointerEvents='none'
			style={[
				styles.loop,
				{ left: (word - width) / 2, top: band.top - LOOP_FIT.top * height },
			]}>
			<Path d={loopSvg.path} fill={color} fillRule='evenodd' />
		</Svg>
	);
}

const styles = StyleSheet.create({
	loop: { position: 'absolute' },
});
