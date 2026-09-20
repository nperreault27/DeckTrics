import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import {
	getOverviewLoseReasons,
	getOverviewWinReasons,
	getTurnOrderWinRate,
	getWinStatsByDeck,
	POD_SIZE,
	type DeckWinStats,
	type TagCount,
	type TurnOrderWinRate,
} from '@/lib/db';
import { Txt } from '@/components/notebook/Hand';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { Tally } from '@/components/notebook/Tally';
import { ReasonColumns } from '@/components/notebook/ReasonColumns';
import { MarginNote } from '@/components/notebook/MarginNote';
import { pickNote } from '@/lib/marginNotes';
import { fonts, ink, onRules, RULE_SPACING, screenPadding } from '@/lib/notebook';

// In a four-player pod an even share of wins is 25%; below that is written in red.
const PAR_WIN_RATE = 100 / POD_SIZE;

// A seat, deck or reason needs this many games behind it before the margin note calls it out.
const NOTE_MIN_GAMES = 3;

export default function StatsScreen() {
	const [deckStats, setDeckStats] = useState<DeckWinStats[]>([]);
	const [seatRates, setSeatRates] = useState<TurnOrderWinRate[]>([]);
	const [winReasons, setWinReasons] = useState<TagCount[]>([]);
	const [loseReasons, setLoseReasons] = useState<TagCount[]>([]);

	// Tabs stay mounted, so reload on focus to pick up games logged since.
	useFocusEffect(
		useCallback(() => {
			Promise.all([
				getWinStatsByDeck(),
				getTurnOrderWinRate(),
				getOverviewWinReasons(),
				getOverviewLoseReasons(),
			]).then(([decks, seats, wins, losses]) => {
				setDeckStats(decks);
				setSeatRates(seats);
				setWinReasons(wins);
				setLoseReasons(losses);
			});
		}, []),
	);

	const totalGames = deckStats.reduce((sum, deck) => sum + deck.games, 0);

	const seats = Array.from({ length: POD_SIZE }, (_, i) => {
		const row = seatRates.find((item) => item.turn_order === i + 1);
		return {
			seat: i + 1,
			games: row?.games ?? 0,
			wins: row?.wins ?? 0,
			winRate: Math.round(row?.win_pct ?? 0),
		};
	});
	const bestSeatRate = Math.max(...seats.map((seat) => seat.winRate));

	const deckRecords = deckStats
		.map((deck) => ({
			id: deck.deck_id,
			name: deck.name,
			wins: deck.wins,
			losses: deck.games - deck.wins,
			winRate: deck.games > 0 ? Math.round((deck.wins / deck.games) * 100) : 0,
		}))
		.sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);

	// What the page itself says, for the margin note to pick from.
	const deadSeat = seats.find((seat) => seat.games >= NOTE_MIN_GAMES && seat.wins === 0);
	const bestSeat = seats.filter((seat) => seat.games > 0).sort((a, b) => b.winRate - a.winRate)[0];
	const bestDeck = deckRecords.filter((deck) => deck.wins + deck.losses >= NOTE_MIN_GAMES)[0];
	const topLoss = loseReasons.filter((reason) => reason.count >= NOTE_MIN_GAMES)[0];

	const note = pickNote('stats', [
		deadSeat && `0 for ${deadSeat.games} in seat ${deadSeat.seat}. that seat is cursed.`,
		bestSeat &&
			bestSeat.winRate > PAR_WIN_RATE &&
			`seat ${bestSeat.seat} is carrying me at ${bestSeat.winRate}%. call it early.`,
		bestDeck &&
			(bestDeck.winRate > PAR_WIN_RATE ?
				`${bestDeck.name} is the only deck pulling its weight (${bestDeck.winRate}%)`
			:	`even ${bestDeck.name} is under water at ${bestDeck.winRate}%. rebuild something.`),
		topLoss && `lost to ${topLoss.label.toLowerCase()} ${topLoss.count}× now. maybe pack an answer.`,
		totalGames >= 10 && `${totalGames} games written down and still no idea what I'm doing`,
	]);

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<RuledPaper />

			{totalGames === 0 ?
				<Txt style={styles.empty}>nothing to count yet — write down a game first.</Txt>
			:	<>
					<SectionTitle>By seat</SectionTitle>
					{seats.map((seat) => (
						<View key={seat.seat} style={styles.row}>
							<Txt style={styles.seatLabel}>seat {seat.seat}</Txt>
							<View style={styles.tallies}>
								<Tally count={seat.wins} seed={seat.seat} />
							</View>
							<Txt
								style={[
									styles.seatRate,
									{ color: seat.winRate === bestSeatRate && bestSeatRate > 0 ? ink.blue : ink.ink },
								]}>
								{seat.winRate}%
							</Txt>
						</View>
					))}

					<View style={styles.gap} />
					<SectionTitle>Deck records</SectionTitle>
					{deckRecords.map((deck, index) => (
						<View key={deck.id} style={styles.row}>
							<Txt style={styles.deckName} numberOfLines={1}>
								{deck.name}
							</Txt>
							<Txt style={styles.record}>
								{deck.wins} – {deck.losses}
							</Txt>
							<Txt
								style={[
									styles.deckRate,
									{ color: deck.winRate < PAR_WIN_RATE ? ink.red : ink.blue },
								]}>
								{deck.winRate}%
							</Txt>
							{index < deckRecords.length - 1 && <Rule width={1.5} />}
						</View>
					))}

					<View style={styles.gap} />
					<ReasonColumns winTitle='How I win' wins={winReasons} loseTitle='How I lose' losses={loseReasons} />

					<MarginNote>{note}</MarginNote>
				</>
			}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: ink.paper },
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	// Every block is a whole number of ruled lines tall, so text stays on the rules.
	gap: { height: RULE_SPACING },
	row: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },

	seatLabel: { width: 72, ...onRules(fonts.kalam300, 15), color: ink.body },
	tallies: { flex: 1, overflow: 'hidden' },
	seatRate: { width: 64, ...onRules(fonts.caveat700, 26) },

	deckName: { flex: 1, ...onRules(fonts.caveat600, 22), color: ink.ink },
	record: { width: 64, textAlign: 'right', ...onRules(fonts.caveat500, 20), color: ink.body },
	deckRate: { width: 60, textAlign: 'right', ...onRules(fonts.caveat700, 22) },
});
