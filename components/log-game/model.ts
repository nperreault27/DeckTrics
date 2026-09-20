import { Deck } from '@/lib/db';

// One seat at the table while a game is being written down. Array order is turn order.
export type Seat = {
	key: number; // stable identity for drag-reordering
	deckId: number | null;
	deckName: string;
	isUsers: boolean; // the user's own seat: picks from their decks; the rest are opponents
	won: boolean;
	outTurn: number | null; // turn the seat won or was knocked out on
	reason: string; // game-end tag label: how they won, or what knocked them out
};

export const emptySeat = (key: number, isUsers = false): Seat => ({
	key,
	deckId: null,
	deckName: '',
	isUsers,
	won: false,
	outTurn: null,
	reason: '',
});


export const deckMeta = (deck: Pick<Deck, 'isUsers'>, games: number) =>
	deck.isUsers ? `mine · ${games} ${games === 1 ? 'game' : 'games'}` : `generic · faced ${games}×`;

// Winner is 1st; everyone else ranks by how long they lasted (later knockout = better).
export function placementOf(seat: Seat, seats: Seat[]) {
	if (seat.won) return 1;
	return 2 + seats.filter((other) => !other.won && (other.outTurn ?? 0) > (seat.outTurn ?? 0)).length;
}

export const ordinal = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
