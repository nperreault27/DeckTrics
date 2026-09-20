// Deterministic value in [-1, 1) for a (seed, stroke, channel) triple (mulberry32 finaliser).
// Hashing each stroke independently keeps earlier strokes unchanged when the count grows.
export function wobble(seed: number, stroke: number, channel: number) {
	let t = (seed * 7919 + stroke * 104729 + channel * 15485863 + 0x6d2b79f5) | 0;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
}
