import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

import { RankedBarItem, RankedBarList } from '@/components/RankedBarList';
import {
	getDecksUsedCounts,
	getOverviewTotals,
	getWinStatsByDeck,
	type DeckWinStats,
	type DeckUsageRow,
	type OverviewTotals,
	TagCount,
	TurnOrderWinRate,
	getOverviewWinReasons,
	getOverviewLoseReasons,
	getTurnOrderWinRate,
} from '@/lib/db';

type ReasonMode = 'won' | 'lost';

export default function StatsScreen() {
	const theme = useTheme();

	const [winStats, setWinStats] = useState<DeckWinStats[]>([]);
	const [deckUsage, setDeckUsage] = useState<DeckUsageRow[]>([]);
	const [totals, setTotals] = useState<OverviewTotals | null>(null);
	const [winReasons, setWinReasons] = useState<TagCount[]>([]);
	const [loseReasons, setLoseReasons] = useState<TagCount[]>([]);
	const [turnOrderRates, setTurnOrderRates] = useState<TurnOrderWinRate[]>([]);
	const [reasonMode, setReasonMode] = useState<ReasonMode>('won');

	useEffect(() => {
		Promise.all([
			getWinStatsByDeck(),
			getDecksUsedCounts(),
			getOverviewTotals(),
			getOverviewWinReasons(),
			getOverviewLoseReasons(),
			getTurnOrderWinRate(),
		]).then(([wins, usage, overview, winsByReason, losesByReason, seatRates]) => {
			setWinStats(wins);
			setDeckUsage(usage);
			setTotals(overview);
			setWinReasons(winsByReason);
			setLoseReasons(losesByReason);
			setTurnOrderRates(seatRates);
		});
	}, []);

	const totalGames = useMemo(() => {
		if (winStats.length > 0) {
			return winStats.reduce((sum, deck) => sum + deck.games, 0);
		}

		return totals?.games_played ?? 0;
	}, [winStats, totals]);

	const totalWins = useMemo(() => winStats.reduce((sum, deck) => sum + deck.wins, 0), [winStats]);

	const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
	const losses = Math.max(totalGames - totalWins, 0);
	const avgGameTurns = totals?.avg_turns ? Number(totals.avg_turns.toFixed(1)) : null;
	const deckCount = deckUsage.length;

	const topDecks = useMemo(() => {
		return winStats
			.map((deck) => {
				const pct = deck.games ? Math.round((deck.wins / deck.games) * 100) : 0;

				return {
					id: deck.deck_id,
					label: deck.name,
					value: pct,
					valueLabel: `${pct}%`,
					countLabel: `${deck.games}`,
				};
			})
			.sort((a, b) => b.value - a.value)
			.slice(0, 4);
	}, [winStats]);

	const radius = 80;
	const circumference = 2 * Math.PI * radius;
	const dashOffset = circumference - (winRate / 100) * circumference;

	const reasonGames = reasonMode === 'won' ? totalWins : losses;
	const reasonData: RankedBarItem[] = (reasonMode === 'won' ? winReasons : loseReasons).map(
		(reason) => {
			return {
				id: reason.tag_id,
				label: reason.label,
				value: reason.count,
				valueLabel: `${reason.count}`,
				countLabel: `${Math.round((reason.count / reasonGames) * 100)}%`,
			};
		},
	);

	const turnOrderRows = useMemo(() => {
		const base = [1, 2, 3, 4].map((seat) => {
			const row = turnOrderRates.find((item) => item.turn_order === seat);

			return { seat, games: row?.games ?? 0, wins: row?.wins ?? 0, winRate: row?.win_pct ?? 0 };
		});

		return base;
	}, [turnOrderRates]);

	const maxTurnRate = Math.max(...turnOrderRows.map((item) => item.winRate), 0);

	return (
		<View style={[styles.root, { backgroundColor: theme.colors.background }]}>
			<ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
				<View style={[styles.summaryCard, { backgroundColor: theme.colors.background }]}>
					<View style={styles.donutWrap}>
						<Svg width={220} height={220} viewBox='0 0 180 180'>
							<Circle
								cx='90'
								cy='90'
								r={radius}
								stroke={theme.colors.surface}
								strokeWidth={16}
								fill='transparent'
							/>
							<Circle
								cx='90'
								cy='90'
								r={radius}
								stroke={theme.colors.primary}
								strokeWidth={16}
								fill='transparent'
								strokeDasharray={circumference}
								strokeDashoffset={dashOffset}
								strokeLinecap='round'
								transform='rotate(-90 90 90)'
							/>
						</Svg>

						<View style={styles.donutCenter}>
							<Text style={[styles.winPercent, { color: theme.colors.primary }]}>{winRate}%</Text>
							<Text style={[styles.winRateLabel, { color: theme.colors.tertiary }]}>WIN RATE</Text>
							<Text style={[styles.winRateMeta, { color: theme.colors.tertiary }]}>
								{totalWins} W · {losses} L
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.metricRow}>
					<View
						style={[
							styles.metricCard,
							{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
						]}>
						<Text style={[styles.metricLabel, { color: theme.colors.tertiary }]}>GAMES</Text>
						<Text style={styles.metricValue}>{totalGames}</Text>
					</View>

					<View
						style={[
							styles.metricCard,
							{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
						]}>
						<Text style={[styles.metricLabel, { color: theme.colors.tertiary }]}>AVG GAME</Text>
						<Text style={styles.metricValue}>
							{avgGameTurns !== null ? `${Math.round(avgGameTurns)}` : '—'} Turns
						</Text>
					</View>

					<View
						style={[
							styles.metricCard,
							{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
						]}>
						<Text style={[styles.metricLabel, { color: theme.colors.tertiary }]}>DECKS</Text>
						<Text style={styles.metricValue}>{deckCount}</Text>
					</View>
				</View>

				<View
					style={[
						styles.sectionPanel,
						{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
					]}>
					<Text style={[styles.sectionTitle, { color: theme.colors.tertiary }]}>BEST DECKS</Text>

					{topDecks.length > 0 ?
						<RankedBarList items={topDecks} barHeight={8} maxValue={100} />
					:	<Text style={[styles.emptyText, { color: theme.colors.tertiary }]}>
							Not enough data yet.
						</Text>
					}
				</View>

				<View
					style={[
						styles.sectionPanel,
						{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
					]}>
					<View
						style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
						<Text style={[styles.sectionTitle, { color: theme.colors.tertiary }]}>
							GAME END REASONS
						</Text>
						<View
							style={[
								styles.segmentedControl,
								{ backgroundColor: theme.colors.background, borderColor: theme.colors.outline },
							]}>
							{(['won', 'lost'] as const).map((mode) => {
								const selected = reasonMode === mode;

								return (
									<Pressable
										key={mode}
										onPress={() => setReasonMode(mode)}
										accessibilityRole='tab'
										accessibilityState={{ selected }}
										style={[styles.segment, selected && { backgroundColor: theme.colors.primary }]}>
										<Text
											style={[
												styles.segmentText,
												{ color: selected ? theme.colors.onPrimary : theme.colors.tertiary },
											]}>
											{mode === 'won' ? 'WON' : 'LOST'}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</View>

					{reasonData.length > 0 ?
						<RankedBarList items={reasonData} barHeight={8} />
					:	<Text style={[styles.emptyText, { color: theme.colors.tertiary }]}>
							Not enough data yet.
						</Text>
					}
				</View>

				<View
					style={[
						styles.sectionPanel,
						{ backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
					]}>
					<Text style={[styles.sectionTitle, { color: theme.colors.tertiary }]}>
						TURN ORDER ADVANTAGE
					</Text>

					<View style={styles.turnOrderList}>
						{totalWins > 0 ?
							turnOrderRows.map((seat) => {
								const isTop = seat.winRate === maxTurnRate && maxTurnRate > 0;
								return (
									<View key={seat.seat} style={styles.turnSeatRow}>
										<Text
											style={[
												styles.turnValue,
												{ color: isTop ? theme.colors.primary : theme.colors.tertiary },
											]}>
											{seat.winRate}%
										</Text>

										<View
											style={[styles.turnBarTrack, { backgroundColor: theme.colors.background }]}>
											<View
												style={[
													styles.turnBarFill,
													{
														width: `${Math.max(seat.winRate, 8)}%`,
														backgroundColor: isTop ? theme.colors.primary : theme.colors.tertiary,
													},
												]}
											/>
										</View>

										<Text style={[styles.turnLabel, { color: theme.colors.tertiary }]}>
											SEAT {seat.seat}
										</Text>
									</View>
								);
							})
						:	<Text style={[styles.emptyText, { color: theme.colors.tertiary }]}>
								Not enough data yet.
							</Text>
						}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 24 },
	summaryCard: { alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
	donutWrap: {
		width: 220,
		height: 220,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	donutCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
	winPercent: { fontSize: 40, fontWeight: '700', letterSpacing: -1.2, lineHeight: 44 },
	winRateLabel: { fontSize: 11, letterSpacing: 1.2, marginTop: 2 },
	winRateMeta: { fontSize: 12, marginTop: 4, opacity: 0.9 },
	metricRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
	metricCard: {
		flex: 1,
		borderRadius: 0,
		borderWidth: 1,
		paddingHorizontal: 12,
		paddingVertical: 12,
		minHeight: 72,
		justifyContent: 'center',
	},
	metricLabel: { fontSize: 10, letterSpacing: 1.2, marginBottom: 6 },
	metricValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.6 },
	sectionPanel: {
		borderRadius: 0,
		borderWidth: 1,
		paddingHorizontal: 14,
		paddingTop: 12,
		paddingBottom: 10,
		marginBottom: 18,
	},
	sectionTitle: { fontSize: 11, letterSpacing: 1.2, marginBottom: 16, fontWeight: '700' },
	emptyText: { fontSize: 12 },
	turnOrderList: { gap: 10 },
	turnSeatRow: { gap: 6 },
	turnValue: { fontSize: 30, fontWeight: '700', lineHeight: 32 },
	turnBarTrack: { width: '100%', height: 10, borderRadius: 999, overflow: 'hidden' },
	turnBarFill: { height: '100%', borderRadius: 999 },
	turnLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
	segmentedControl: { flexDirection: 'row', borderWidth: 1, marginBottom: 16 },
	segment: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
	segmentText: { fontSize: 11, fontWeight: '700', paddingHorizontal: 12 },
});
