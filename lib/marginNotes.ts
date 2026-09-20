// The scribbles in the margin. See docs/UI_SPEC.md — "occasional marginal annotation".
//
// A note is either an observation about what's actually on the page ("0 for 5 in seat 4") or a
// line from the list below. Each placement rolls between the two at the start of the session, so
// a screen reads differently from one session to the next instead of settling into a caption.

const MARGIN_NOTES = [
	'stop casting Krenko into open mana',
	'the combo player is always the quiet one',
	'maybe running 26 lands isn\'t enough',
	'remember to actually attack',
	'decks perform better when I have a turn 1 sol ring',
	'kill the elf player first. always.',
	'do not trust anyone who says "it\'s a 7"',
	'maybe play some removal?',
	'stop forgetting my triggers',
	'mulligan to 5, still no lands. ADD LANDS!',
	'board wipe count this week: too many',
	'the archenemy should have been me',
	'reading the card explains the card',
	'bluffing works: always leave open 2 blue mana',
	'"i\'m not a threat" — the threat',
	'the blue player always has cyclonic rift',
	'heh big creatures go brrrrrr',
	'shuffle better',
	'group hug players must die first',
];

// Every placement that can show a note, in the order they take their line from the shuffled list
// below. A placement's position here is its index, so no two can land on the same note. There
// must be at least as many notes as placements.
const SLOTS = ['stats', 'deck', 'deck-empty'] as const;

export type NoteSlot = (typeof SLOTS)[number];

const OBSERVATION_CHANCE = 0.6;

function shuffle(pool: readonly string[]) {
	const out = [...pool];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

const NOTES = shuffle(MARGIN_NOTES);

const ROLLS = new Map<NoteSlot, { observe: boolean; pick: number }>(
	SLOTS.map((slot) => [slot, { observe: Math.random() < OBSERVATION_CHANCE, pick: Math.random() }]),
);

export function pickNote(slot: NoteSlot, observations: (string | null | undefined | false)[] = []) {
	const roll = ROLLS.get(slot)!;
	const facts = observations.filter((note): note is string => !!note);
	if (roll.observe && facts.length > 0) return facts[Math.floor(roll.pick * facts.length)];
	return NOTES[SLOTS.indexOf(slot)];
}
