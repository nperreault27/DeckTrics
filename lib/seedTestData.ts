import { createDeck, createGame, listDecks, listTagsByCategory, POD_SIZE, SeatInput } from '@/lib/db';


const USER_DECKS = [
	{ name: 'Atraxa Superfriends', commander: "Atraxa, Praetors' Voice" },
	{ name: 'Krenko Goblins', commander: 'Krenko, Mob Boss' },
	{ name: 'Muldrotha Value', commander: 'Muldrotha, the Gravetide' },
];

const OPPONENT_DECKS = [
	{ name: 'Edgar Vampires', commander: 'Edgar Markov' },
	{ name: 'Urza Artifacts', commander: 'Urza, Lord High Artificer' },
	{ name: 'Meren Reanimator', commander: 'Meren of Clan Nel Toth' },
	{ name: 'Lathril Elves', commander: 'Lathril, Blade of the Elves' },
	{ name: 'Kaalia Angels', commander: 'Kaalia of the Vast' },
	{ name: 'Yuriko Ninjas', commander: 'Yuriko, the Tiger\'s Shadow' },
];

const GAME_COUNT = 24;

function makeRandom(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

export async function seedTestData() {
	const random = makeRandom(42);
	const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

	const existing = new Map((await listDecks()).map((deck) => [deck.name, deck.id]));
	const ensureDeck = async (deck: { name: string; commander: string }, isUsers: boolean) =>
		existing.get(deck.name) ?? (await createDeck(deck.name, isUsers, deck.commander));

	const userDeckIds: number[] = [];
	for (const deck of USER_DECKS) userDeckIds.push(await ensureDeck(deck, true));
	const opponentDeckIds: number[] = [];
	for (const deck of OPPONENT_DECKS) opponentDeckIds.push(await ensureDeck(deck, false));

	const endReasons = await listTagsByCategory('game_end_reason');
	const commentTags = await listTagsByCategory('comment');

	for (let g = 0; g < GAME_COUNT; g++) {
		const totalTurns = 7 + Math.floor(random() * 9);

		// User in one random seat, three distinct opponents in the rest.
		const opponents = [...opponentDeckIds].sort(() => random() - 0.5).slice(0, POD_SIZE - 1);
		const userSeat = Math.floor(random() * POD_SIZE);
		const deckIds = [...opponents];
		deckIds.splice(userSeat, 0, pick(userDeckIds));

		// Winner survives to the end; losers are knocked out earlier, later knockout = better placement.
		const winnerSeat = Math.floor(random() * POD_SIZE);
		const knockoutTurns = deckIds.map((_, i) =>
			i === winnerSeat ? totalTurns : Math.max(3, totalTurns - Math.floor(random() * 5)),
		);

		const seats: SeatInput[] = deckIds.map((deckId, i) => {
			const won = i === winnerSeat;
			const placement =
				won ? 1 : (
					2 + knockoutTurns.filter((turn, j) => j !== winnerSeat && j !== i && turn > knockoutTurns[i]).length
				);
			const reasonId = pick(endReasons).id;
			return {
				deckId,
				turnOrder: i + 1,
				placement,
				eliminatedTurn: won ? null : knockoutTurns[i],
				winConditionId: won ? reasonId : null,
				eliminationReasonId: won ? null : reasonId,
				commentTagIds: random() < 0.4 ? [pick(commentTags).id] : [],
			};
		});

		// Spread games over the last ~3 months, a few days apart.
		const daysAgo = (GAME_COUNT - g) * 4 + Math.floor(random() * 3);
		const playedAt = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 19).replace('T', ' ');

		await createGame({ totalTurns, seats, playedAt });
	}
}
