import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
	getDeckAvgTurnsWinLose,
	getDeckCommentTagCounts,
	getDeckLoseReasons,
	getDeckMatchups,
	getDeckWinRateByTurnOrder,
	getDeckWinReasons,
	POD_SIZE,
	type AvgTurnsWinLose,
	type Matchup,
	type TagCount,
	type TurnOrderWinRate,
} from '@/lib/db';
import { fonts, ink, onRules, overhang, RULE_SPACING, screenPadding } from '@/lib/notebook';
import { pickNote } from '@/lib/marginNotes';
import { useDecksStore } from '@/store/useDecksStore';
import { Txt } from '@/components/notebook/Hand';
import { MarginNote } from '@/components/notebook/MarginNote';
import { PageHead } from '@/components/notebook/PageHead';
import { ReasonColumns } from '@/components/notebook/ReasonColumns';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { ScribbleBars } from '@/components/notebook/ScribbleBars';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { StatRow } from '@/components/notebook/StatRow';
import { ordinal } from '@/components/log-game/model';

// Winning at least half the games an opponent was at the table reads as a good matchup.
const GOOD_MATCHUP = 50;

// A matchup or a reason needs this many games behind it before the margin note calls it out.
const NOTE_MIN_GAMES = 3;

const pct = (wins: number, games: number) => (games > 0 ? Math.round((wins / games) * 100) : 0);

export default function DeckScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const deckId = Number(id);
	const { decks, loadDecks } = useDecksStore();
	const deck = decks.find((d) => d.id === deckId);

	const [seatRows, setSeatRows] = useState<TurnOrderWinRate[]>([]);
	const [avgTurns, setAvgTurns] = useState<AvgTurnsWinLose | null>(null);
	const [winReasons, setWinReasons] = useState<TagCount[]>([]);
	const [loseReasons, setLoseReasons] = useState<TagCount[]>([]);
	const [matchups, setMatchups] = useState<Matchup[]>([]);
	const [comments, setComments] = useState<TagCount[]>([]);

	useEffect(() => {
		if (!deck) loadDecks();
		Promise.all([
			getDeckWinRateByTurnOrder(deckId),
			getDeckAvgTurnsWinLose(deckId),
			getDeckWinReasons(deckId),
			getDeckLoseReasons(deckId),
			getDeckMatchups(deckId),
			getDeckCommentTagCounts(deckId),
		]).then(([seats, avg, wins, losses, opponents, tags]) => {
			setSeatRows(seats);
			setAvgTurns(avg);
			setWinReasons(wins);
			setLoseReasons(losses);
			setMatchups(opponents);
			setComments(tags);
		});
	}, [deckId]);

	const games = seatRows.reduce((sum, row) => sum + row.games, 0);
	const wins = seatRows.reduce((sum, row) => sum + row.wins, 0);

	const seats = Array.from({ length: POD_SIZE }, (_, i) => {
		const row = seatRows.find((r) => r.turn_order === i + 1);
		return { seat: i + 1, games: row?.games ?? 0, rate: pct(row?.wins ?? 0, row?.games ?? 0) };
	});
	const bestSeat = seats
		.filter((seat) => seat.games > 0)
		.sort((a, b) => b.rate - a.rate || b.games - a.games)[0];

	const sortedMatchups = [...matchups].sort(
		(a, b) => pct(b.wins, b.games) - pct(a.wins, a.games) || b.games - a.games,
	);
	const sortedComments = [...comments].sort((a, b) => b.count - a.count);

	const oneDecimal = (value: number | null | undefined) => (value ? value.toFixed(1) : '—');

	// What the page itself says, for the margin note to pick from.
	const worstSeat = seats.filter((seat) => seat.games > 0).sort((a, b) => a.rate - b.rate)[0];
	const badMatchup = sortedMatchups
		.filter((m) => m.games >= NOTE_MIN_GAMES && pct(m.wins, m.games) < GOOD_MATCHUP)
		.slice(-1)[0];
	const topLoss = loseReasons.filter((reason) => reason.count >= 2)[0];
	const topComment = sortedComments[0];
	const slowLoss =
		avgTurns?.avg_turns_to_win != null &&
		avgTurns?.avg_turns_to_lose != null &&
		avgTurns.avg_turns_to_lose > avgTurns.avg_turns_to_win;

	const note = pickNote('deck', [
		worstSeat &&
			worstSeat.rate === 0 &&
			`never won a game from seat ${worstSeat.seat} with this one`,
		badMatchup &&
			`${badMatchup.opponent_deck_name} has this deck's number — ${badMatchup.wins} of ${badMatchup.games}`,
		topLoss && `${topLoss.label.toLowerCase()} keeps ending it. ${topLoss.count} times now.`,
		topComment && `the table keeps writing "${topComment.label.toLowerCase()}" next to this one`,
		slowLoss && 'it wins fast or it loses slow. no middle.',
	]);

	return (
		<View style={styles.screen}>
			<PageHead
				label='deck'
				right={`${games} ${games === 1 ? 'game' : 'games'}`}
				title={deck?.name}
				subtitle={deck?.commander ?? undefined}
				onBack={() => router.back()}
			/>
			<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
				<RuledPaper margin />

				{games === 0 ?
					<View>
						<Txt style={styles.empty}>no games with this deck yet.</Txt>
						<MarginNote prefix='ps.'>{pickNote('deck-empty')}</MarginNote>
					</View>
				:	<>
						<SectionTitle>Win rate</SectionTitle>
						<View style={styles.hero}>
							<Txt style={styles.heroNumber}>{pct(wins, games)}%</Txt>
							<View style={styles.record}>
								<Txt style={styles.recordText}>
									{wins} {wins === 1 ? 'win' : 'wins'}, {games - wins}{' '}
									{games - wins === 1 ? 'loss' : 'losses'}
								</Txt>
							</View>
						</View>

						<StatRow
							stats={[
								{ label: 'Avg win', value: oneDecimal(avgTurns?.avg_turns_to_win) },
								{ label: 'Avg loss', value: oneDecimal(avgTurns?.avg_turns_to_lose) },
								{ label: 'Best seat', value: bestSeat ? ordinal(bestSeat.seat) : '—' },
							]}
						/>

						<View style={styles.gap} />
						<SectionTitle>Win rate by seat</SectionTitle>
						<ScribbleBars
							seed={deckId}
							bars={seats.map((seat) => ({
								label: `seat ${seat.seat}`,
								value: seat.rate,
								valueLabel: seat.games > 0 ? `${seat.rate}%` : '—',
							}))}
						/>

						<View style={styles.gap} />
						<ReasonColumns
							winTitle='Wins by'
							wins={winReasons}
							loseTitle='Losses by'
							losses={loseReasons}
						/>

						{sortedMatchups.length > 0 && (
							<>
								<View style={styles.gap} />
								<SectionTitle>Matchups</SectionTitle>
								{sortedMatchups.map((matchup, index) => {
									const rate = pct(matchup.wins, matchup.games);
									return (
										<View key={matchup.opponent_deck_id} style={styles.row}>
											<Txt style={styles.rowName} numberOfLines={1}>
												{matchup.opponent_deck_name}
											</Txt>
											<Txt style={styles.rowRecord}>
												{matchup.wins} / {matchup.games}
											</Txt>
											<Txt
												style={[
													styles.rowRate,
													{ color: rate < GOOD_MATCHUP ? ink.red : ink.blue },
												]}>
												{rate}%
											</Txt>
											{index < sortedMatchups.length - 1 && <Rule width={1.5} />}
										</View>
									);
								})}
							</>
						)}

						{sortedComments.length > 0 && (
							<>
								<View style={styles.gap} />
								<SectionTitle>Notes from the table</SectionTitle>
								{sortedComments.map((tag, index) => (
									<View key={tag.tag_id} style={styles.row}>
										<Txt style={styles.noteLabel} numberOfLines={1}>
											{tag.label.toLowerCase()}
										</Txt>
										<Txt style={styles.noteCount}>
											{tag.count} of {games}
										</Txt>
										{index < sortedComments.length - 1 && <Rule width={1.5} />}
									</View>
								))}
							</>
						)}

						<MarginNote prefix='ps'>{note}</MarginNote>
					</>
				}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: ink.paper },
	// Every block is a whole number of ruled lines tall, so text stays on the rules.
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	gap: { height: RULE_SPACING },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },

	hero: { flexDirection: 'row', height: RULE_SPACING * 2 },
	heroNumber: {
		...onRules(fonts.caveat700, 82, 2),
		transform: [{ translateY: -3 }],
		color: ink.blue,
	},
	fraction: { marginLeft: 4 - overhang(82), alignItems: 'center' },
	fractionText: { ...onRules(fonts.caveat500, 24), paddingHorizontal: 3, color: ink.ink },
	// Drawn between the numerator's and denominator's lines.
	fractionBar: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: RULE_SPACING + 4,
		height: 1.5,
		backgroundColor: ink.ink,
	},
	record: { marginLeft: 12, marginTop: RULE_SPACING },
	recordText: { ...onRules(fonts.kalam300, 13), color: ink.body },

	row: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	rowName: { flex: 1, ...onRules(fonts.caveat600, 22), color: ink.ink },
	rowRecord: { width: 64, textAlign: 'right', ...onRules(fonts.caveat500, 20), color: ink.body },
	rowRate: { width: 60, textAlign: 'right', ...onRules(fonts.caveat700, 22) },
	noteLabel: { flex: 1, ...onRules(fonts.kalam300, 14), color: ink.body },
	noteCount: { ...onRules(fonts.caveat600, 20), color: ink.ink },
});
