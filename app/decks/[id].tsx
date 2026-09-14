import { useEffect, useState, ReactNode } from 'react';
import { ScrollView, View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, Card, useTheme } from 'react-native-paper';

import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryPie } from 'victory-native';

import {
	getDeckWinRateByTurnOrder,
	getDeckCommentTagCounts,
	getDeckAvgTurnsWinLose,
	getDeckGamesPlayedWonByMonth,
	getDeckMatchups,
	getDeckWinReasons,
	getDeckLoseReasons,
	TurnOrderWinRate,
	TagCount,
	AvgTurnsWinLose,
	MonthlyPlayedWon,
	Matchup,
} from '@/lib/db';

const PIE_COLORS = [
	'#2563eb',
	'#16a34a',
	'#d97706',
	'#dc2626',
	'#7c3aed',
	'#0891b2',
	'#db2777',
	'#65a30d',
];

export default function DeckStatsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const deckId = Number(id);
	const theme = useTheme();
	const { width } = useWindowDimensions();

	const [winRateByTurn, setWinRateByTurn] = useState<TurnOrderWinRate[]>([]);
	const [comments, setComments] = useState<TagCount[]>([]);
	const [avgTurns, setAvgTurns] = useState<AvgTurnsWinLose | null>(null);
	const [monthly, setMonthly] = useState<MonthlyPlayedWon[]>([]);
	const [matchups, setMatchups] = useState<Matchup[]>([]);
	const [winReasons, setWinReasons] = useState<TagCount[]>([]);
	const [loseReasons, setLoseReasons] = useState<TagCount[]>([]);
	const [selectedTurn, setSelectedTurn] = useState<number | null>(null);
	const [turnTooltipPosition, setTurnTooltipPosition] = useState<{ x: number; y: number } | null>(
		null,
	);
	const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
	const [monthTooltipPosition, setMonthTooltipPosition] = useState<{ x: number; y: number } | null>(
		null,
	);
	const [selectedComment, setSelectedComment] = useState<number | null>(null);
	const [commentTooltipPosition, setCommentTooltipPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [selectedWinReason, setSelectedWinReason] = useState<number | null>(null);
	const [winReasonTooltipPosition, setWinReasonTooltipPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	const [selectedLoseReason, setSelectedLoseReason] = useState<number | null>(null);
	const [loseReasonTooltipPosition, setLoseReasonTooltipPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);

	useEffect(() => {
		getDeckWinRateByTurnOrder(deckId).then(setWinRateByTurn);

		getDeckCommentTagCounts(deckId).then(setComments);

		getDeckAvgTurnsWinLose(deckId).then(setAvgTurns);

		getDeckGamesPlayedWonByMonth(deckId).then(setMonthly);

		getDeckMatchups(deckId).then(setMatchups);

		getDeckWinReasons(deckId).then(setWinReasons);

		getDeckLoseReasons(deckId).then(setLoseReasons);
	}, [deckId]);

	const chartWidth = Math.min(width - 32, 500);
	const gamesPlayed = monthly.reduce((total, month) => total + month.played, 0);
	const winRateBarData = winRateByTurn.map((row, index) => ({
		x: index + 1,
		y: row.games ? Math.round((row.wins / row.games) * 100) : 0,
		seat: row.turn_order,
	}));

	const maxWinRate =
		winRateBarData.length > 0 ? Math.max(...winRateBarData.map((item) => item.y)) : 100;

	const monthLabels = monthly.map((m) => m.month.slice(2));

	const playedLine = monthly.map((m, index) => ({
		x: index + 1,
		y: m.played,
		month: monthLabels[index],
	}));

	const wonLine = monthly.map((m, index) => ({
		x: index + 1,
		y: m.won,
		month: monthLabels[index],
	}));

	const maxMonthlyValue =
		monthly.length > 0 ? Math.max(...monthly.flatMap((m) => [m.played, m.won])) : 1;

	const winReasonPieData = winReasons.map((item, index) => ({
		x: item.label,
		y: item.count,
		color: PIE_COLORS[index % PIE_COLORS.length],
	}));

	const loseReasonPieData = loseReasons.map((item, index) => ({
		x: item.label,
		y: item.count,
		color: PIE_COLORS[index % PIE_COLORS.length],
	}));

	const sortedMatchups = [...matchups].sort((a, b) => {
		const aRate = a.games > 0 ? a.wins / a.games : 0;
		const bRate = b.games > 0 ? b.wins / b.games : 0;
		return bRate - aRate;
	});

	const bestMatchups = sortedMatchups.slice(0, Math.min(3, sortedMatchups.length));
	const worstMatchups = [...sortedMatchups].reverse().slice(0, Math.min(3, sortedMatchups.length));

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.metricsRow}>
				<MetricCard
					title='Avg turns to win'
					value={avgTurns?.avg_turns_to_win ? avgTurns.avg_turns_to_win.toFixed(1) : '—'}
					suffix='turns'
				/>

				<MetricCard
					title='Avg turns to lose'
					value={avgTurns?.avg_turns_to_lose ? avgTurns.avg_turns_to_lose.toFixed(1) : '—'}
					suffix='turns'
				/>

				<MetricCard title='Games played' value={gamesPlayed.toString()} />
			</View>

			<Section title='Win rate by turn order'>
				{winRateBarData.length === 0 ?
					<Empty />
				:	<View style={styles.chartContainer}>
						<View style={[styles.chartWrapper, { width: chartWidth, height: 300 }]}>
							<VictoryChart
								width={chartWidth}
								height={300}
								domain={{
									x: [0.5, winRateBarData.length + 0.5],
									y: [0, Math.max(100, maxWinRate * 1.2)],
								}}
								padding={{ top: 30, bottom: 60, left: 55, right: 20 }}>
								<VictoryAxis
									tickValues={winRateBarData.map((item) => item.x)}
									tickFormat={winRateBarData.map((item) => `Seat ${item.seat}`)}
									style={{
										axis: { stroke: theme.colors.outline },
										ticks: { stroke: theme.colors.outline },
										tickLabels: { fill: '#aaa', fontSize: 10 },
									}}
								/>

								<VictoryAxis
									dependentAxis
									tickFormat={(value) => `${value}%`}
									style={{
										axis: { stroke: theme.colors.outline },
										ticks: { stroke: theme.colors.outline },
										tickLabels: { fill: '#aaa', fontSize: 10 },
										grid: { stroke: theme.colors.surfaceVariant },
									}}
								/>

								<VictoryBar
									data={winRateBarData}
									barWidth={Math.max(16, Math.min(45, 180 / Math.max(winRateBarData.length, 1)))}
									style={{ data: { fill: '#2563eb' } }}
									cornerRadius={{ top: 4 }}
								/>
							</VictoryChart>

							<View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
								{winRateBarData.map((item, index) => {
									const plotLeft = 55;
									const plotRight = 20;
									const plotWidth = chartWidth - plotLeft - plotRight;
									const slotWidth = plotWidth / winRateBarData.length;
									const centerX = plotLeft + slotWidth * (index + 0.5);

									return (
										<Pressable
											key={item.seat}
											onPress={(event) => {
												event.stopPropagation();

												const { locationX, locationY } = event.nativeEvent;

												if (selectedTurn === item.seat) {
													setSelectedTurn(null);
													setTurnTooltipPosition(null);
													return;
												}

												setSelectedTurn(item.seat);

												setTurnTooltipPosition({ x: locationX, y: locationY });
											}}
											style={[
												styles.barTapTarget,
												{ left: centerX - slotWidth / 2, width: slotWidth, top: 30, bottom: 55 },
											]}
										/>
									);
								})}
							</View>

							{selectedTurn !== null && turnTooltipPosition && (
								<TapTooltip
									x={turnTooltipPosition.x}
									y={turnTooltipPosition.y}
									chartWidth={chartWidth}
									chartHeight={300}
									text={(() => {
										const item = winRateByTurn.find((row) => row.turn_order === selectedTurn);

										if (!item) {
											return '';
										}

										const rate = item.games ? Math.round((item.wins / item.games) * 100) : 0;

										return `Seat ${item.turn_order}: ${rate}% (${item.wins}/${item.games})`;
									})()}
								/>
							)}
						</View>
					</View>
				}
			</Section>

			<Section title='Games played / won over time'>
				{playedLine.length === 0 ?
					<Empty />
				:	<>
						<View style={styles.chartContainer}>
							<View style={[styles.chartWrapper, { width: chartWidth, height: 300 }]}>
								<VictoryChart
									width={chartWidth}
									height={300}
									domain={{
										x: [1, Math.max(1, monthly.length)],
										y: [0, Math.max(1, maxMonthlyValue * 1.2)],
									}}
									padding={{ top: 30, bottom: 55, left: 55, right: 20 }}>
									<VictoryAxis
										tickValues={playedLine.map((item) => item.x)}
										tickFormat={playedLine.map((item) => item.month)}
										style={{
											axis: { stroke: theme.colors.outline },
											ticks: { stroke: theme.colors.outline },
											tickLabels: {
												fill: '#aaa',
												fontSize: 9,
												angle: monthly.length > 6 ? -45 : 0,
												textAnchor: monthly.length > 6 ? 'end' : 'middle',
											},
										}}
									/>

									<VictoryAxis
										dependentAxis
										style={{
											axis: { stroke: theme.colors.outline },
											ticks: { stroke: theme.colors.outline },
											tickLabels: { fill: '#aaa', fontSize: 10 },
											grid: { stroke: theme.colors.surfaceVariant },
										}}
									/>

									<VictoryLine
										data={playedLine}
										interpolation='natural'
										style={{ data: { stroke: '#2563eb', strokeWidth: 3 } }}
									/>

									<VictoryLine
										data={wonLine}
										interpolation='natural'
										style={{ data: { stroke: '#16a34a', strokeWidth: 3 } }}
									/>
								</VictoryChart>

								<View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
									{playedLine.map((item, index) => {
										const plotLeft = 55;
										const plotRight = 20;
										const plotWidth = chartWidth - plotLeft - plotRight;
										const slotWidth =
											monthly.length > 1 ? plotWidth / (monthly.length - 1) : plotWidth;
										const centerX =
											monthly.length > 1 ? plotLeft + slotWidth * index : chartWidth / 2;
										const touchWidth = monthly.length > 1 ? Math.max(40, slotWidth) : plotWidth;

										return (
											<Pressable
												key={`${item.month}-${index}`}
												onPress={(event) => {
													event.stopPropagation();
													const { locationX, locationY } = event.nativeEvent;
													if (selectedMonth === index) {
														setSelectedMonth(null);
														setMonthTooltipPosition(null);
														return;
													}

													setSelectedMonth(index);

													setMonthTooltipPosition({ x: locationX, y: locationY });
												}}
												style={[
													styles.lineTapTarget,
													{
														left: centerX - touchWidth / 2,
														width: touchWidth,
														top: 30,
														bottom: 45,
													},
												]}
											/>
										);
									})}
								</View>

								{selectedMonth !== null && monthTooltipPosition && (
									<TapTooltip
										x={monthTooltipPosition.x}
										y={monthTooltipPosition.y}
										chartWidth={chartWidth}
										chartHeight={300}
										text={(() => {
											const item = monthly[selectedMonth];

											if (!item) {
												return '';
											}

											return `${item.month}: ${item.played} played · ${item.won} won`;
										})()}
									/>
								)}
							</View>
						</View>

						<Text style={styles.legend}>
							<Text style={{ color: '#2563eb' }}>■</Text> Played{'  '}
							<Text style={{ color: '#16a34a' }}>■</Text> Won
						</Text>
					</>
				}
			</Section>

			<Section title='Post-game comments'>
				{comments.length === 0 || gamesPlayed === 0 ?
					<Empty />
				:	<CommentPercentageChart
						comments={comments}
						totalGames={gamesPlayed}
						chartWidth={chartWidth}
					/>
				}
			</Section>

			<Section title='Ways this deck wins'>
				{winReasonPieData.length === 0 ?
					<Empty />
				:	<PieChartSection
						data={winReasonPieData}
						chartWidth={chartWidth}
						selectedIndex={selectedWinReason}
						setSelectedIndex={setSelectedWinReason}
						tooltipPosition={winReasonTooltipPosition}
						setTooltipPosition={setWinReasonTooltipPosition}
					/>
				}
			</Section>

			<Section title='Ways this deck loses'>
				{loseReasonPieData.length === 0 ?
					<Empty />
				:	<PieChartSection
						data={loseReasonPieData}
						chartWidth={chartWidth}
						selectedIndex={selectedLoseReason}
						setSelectedIndex={setSelectedLoseReason}
						tooltipPosition={loseReasonTooltipPosition}
						setTooltipPosition={setLoseReasonTooltipPosition}
					/>
				}
			</Section>

			<Section title='Best matchups'>
				{bestMatchups.length === 0 ?
					<Empty />
				:	bestMatchups.map((m) => <MatchupRow key={m.opponent_deck_id} matchup={m} />)}
			</Section>

			<Section title='Worst matchups'>
				{worstMatchups.length === 0 ?
					<Empty />
				:	worstMatchups.map((m) => <MatchupRow key={m.opponent_deck_id} matchup={m} />)}
			</Section>
		</ScrollView>
	);
}

function MetricCard({ title, value, suffix }: { title: string; value: string; suffix?: string }) {
	return (
		<Card style={styles.metricCard}>
			<Card.Content style={styles.metricContent}>
				<Text variant='labelMedium' style={styles.metricTitle} numberOfLines={2}>
					{title}
				</Text>

				<Text variant='headlineSmall'>{value}</Text>

				{suffix ?
					<Text style={styles.metricSuffix}>{suffix}</Text>
				:	<View style={styles.metricSuffixSpace} />}
			</Card.Content>
		</Card>
	);
}

function CommentPercentageChart({
	comments,
	totalGames,
	chartWidth,
}: {
	comments: TagCount[];
	totalGames: number;
	chartWidth: number;
}) {
	const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

	const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
	const data = [...comments]
		.map((comment) => ({
			label: comment.label,
			count: comment.count,
			percentage: totalGames > 0 ? Math.round((comment.count / totalGames) * 1000) / 10 : 0,
		}))
		.sort((a, b) => b.percentage - a.percentage);
	const rowHeight = 48;
	const chartHeight = data.length * rowHeight + 30;
	const labelWidth = 105;
	const percentageWidth = chartWidth - labelWidth - 20;

	return (
		<View style={[styles.commentChart, { width: chartWidth, height: chartHeight }]}>
			{data.map((item, index) => {
				const top = index * rowHeight + 8;
				const barWidth = Math.max(2, (item.percentage / 100) * percentageWidth);

				return (
					<View
						key={`${item.label}-${index}`}
						style={[styles.commentRow, { top, height: rowHeight }]}>
						<Text style={[styles.commentLabel, { width: labelWidth }]} numberOfLines={1}>
							{item.label}
						</Text>
						<View style={[styles.commentBarArea, { width: percentageWidth }]}>
							<View style={styles.commentBarBackground} />
							<View style={[styles.commentBar, { width: barWidth }]} />
							<Text
								style={[
									styles.commentPercentage,
									{ left: Math.min(barWidth + 6, percentageWidth - 35) },
								]}>
								{item.percentage}%
							</Text>
							<Pressable
								onPress={(event) => {
									event.stopPropagation();

									const { locationX, locationY } = event.nativeEvent;

									if (selectedIndex === index) {
										setSelectedIndex(null);

										setTooltipPosition(null);

										return;
									}

									setSelectedIndex(index);

									setTooltipPosition({ x: locationX, y: top + locationY });
								}}
								style={styles.commentTapTarget}
							/>
						</View>
					</View>
				);
			})}
			{selectedIndex !== null && tooltipPosition && (
				<TapTooltip
					x={tooltipPosition.x}
					y={tooltipPosition.y}
					chartWidth={chartWidth}
					chartHeight={chartHeight}
					text={(() => {
						const item = data[selectedIndex];

						if (!item) {
							return '';
						}

						return `${item.label}: ${item.percentage}% (${item.count}/${totalGames} games)`;
					})()}
				/>
			)}
		</View>
	);
}

function PieChartSection({
	data,
	chartWidth,
	selectedIndex,
	setSelectedIndex,
	tooltipPosition,
	setTooltipPosition,
}: {
	data: { x: string; y: number; color: string }[];
	chartWidth: number;
	selectedIndex: number | null;
	setSelectedIndex: (value: number | null) => void;
	tooltipPosition: { x: number; y: number } | null;
	setTooltipPosition: (value: { x: number; y: number } | null) => void;
}) {
	const pieSize = Math.min(chartWidth, 260);

	return (
		<View style={styles.pieSection}>
			<View style={[styles.pieWrapper, { width: pieSize, height: pieSize }]}>
				<VictoryPie
					width={pieSize}
					height={pieSize}
					data={data}
					innerRadius={0}
					padding={10}
					labels={() => ''}
					style={{ data: { fill: ({ datum }) => datum.color, stroke: '#fff', strokeWidth: 1 } }}
				/>

				<View pointerEvents='box-none' style={StyleSheet.absoluteFill}>
					{data.map((item, index) => {
						const count = data.length;
						const center = pieSize / 2;
						const radius = pieSize * 0.34;
						const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
						const x = center + Math.cos(angle) * radius;
						const y = center + Math.sin(angle) * radius;

						return (
							<Pressable
								key={`${item.x}-${index}`}
								onPress={(event) => {
									event.stopPropagation();
									const { locationX, locationY } = event.nativeEvent;
									if (selectedIndex === index) {
										setSelectedIndex(null);
										setTooltipPosition(null);
										return;
									}
									setSelectedIndex(index);
									setTooltipPosition({ x: locationX, y: locationY });
								}}
								style={[styles.pieTapTarget, { left: x - 40, top: y - 40 }]}
							/>
						);
					})}
				</View>

				{selectedIndex !== null && tooltipPosition && (
					<TapTooltip
						x={tooltipPosition.x}
						y={tooltipPosition.y}
						chartWidth={pieSize}
						chartHeight={pieSize}
						text={(() => {
							const item = data[selectedIndex];

							if (!item) {
								return '';
							}

							return `${item.x}: ${item.y}`;
						})()}
					/>
				)}
			</View>

			<View style={styles.legend}>
				{data.map((item, index) => (
					<View key={`${item.x}-${index}`} style={styles.legendItem}>
						<View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
						<Text style={styles.legendText} numberOfLines={1}>
							{item.x}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}

function MatchupRow({ matchup }: { matchup: Matchup }) {
	const percentage = matchup.games > 0 ? Math.round((matchup.wins / matchup.games) * 100) : 0;

	return (
		<View style={styles.matchupRow}>
			<Text style={styles.matchupName} numberOfLines={1}>
				{matchup.opponent_deck_name}
			</Text>

			<Text style={styles.matchupStats}>
				{matchup.wins}/{matchup.games} {percentage}%
			</Text>
		</View>
	);
}

function TapTooltip({
	x,
	y,
	chartWidth,
	chartHeight,
	text,
}: {
	x: number;
	y: number;
	chartWidth: number;
	chartHeight: number;
	text: string;
}) {
	if (!text) {
		return null;
	}

	const tooltipWidth = 170;
	const tooltipHeight = 44;
	const padding = 8;

	let left = x + 10;
	let top = y - tooltipHeight - 10;

	if (left + tooltipWidth > chartWidth - padding) {
		left = x - tooltipWidth - 10;
	}
	if (left < padding) {
		left = padding;
	}
	if (top < padding) {
		top = y + 10;
	}
	if (top + tooltipHeight > chartHeight - padding) {
		top = chartHeight - tooltipHeight - padding;
	}

	return (
		<View pointerEvents='none' style={[styles.tooltip, { left, top }]}>
			<Text style={styles.tooltipText} numberOfLines={2}>
				{text}
			</Text>
		</View>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<View style={styles.section}>
			<Text variant='titleMedium' style={styles.sectionTitle}>
				{title}
			</Text>
			{children}
		</View>
	);
}

function Empty() {
	return <Text style={styles.empty}>Not enough data yet.</Text>;
}

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 48 },
	metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
	metricCard: { flex: 1, minWidth: 0 },
	metricContent: { alignItems: 'center', minHeight: 100, justifyContent: 'center' },
	metricTitle: { textAlign: 'center', marginBottom: 6 },
	metricSuffix: { fontSize: 11, color: '#888', marginTop: 2 },
	metricSuffixSpace: { height: 13 },
	section: { marginBottom: 28 },
	sectionTitle: { marginBottom: 12 },
	chartContainer: { width: '100%', alignItems: 'center', overflow: 'visible' },
	chartWrapper: { position: 'relative', overflow: 'visible' },
	barTapTarget: { position: 'absolute', zIndex: 10 },
	lineTapTarget: { position: 'absolute', zIndex: 10 },
	commentChart: { position: 'relative', overflow: 'visible' },
	commentRow: {
		position: 'absolute',
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
	},
	commentLabel: { color: '#aaa', fontSize: 12, paddingRight: 8, textAlign: 'right' },
	commentBarArea: { height: 28, position: 'relative', justifyContent: 'center' },
	commentBarBackground: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 18,
		borderRadius: 9,
		backgroundColor: '#2a2a2a',
	},
	commentBar: {
		position: 'absolute',
		left: 0,
		height: 18,
		borderRadius: 9,
		backgroundColor: '#2563eb',
	},
	commentPercentage: { position: 'absolute', color: '#aaa', fontSize: 11, fontWeight: '500' },
	commentTapTarget: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 10 },
	pieSection: { alignItems: 'center' },
	pieWrapper: { position: 'relative', overflow: 'visible' },
	pieTapTarget: { position: 'absolute', width: 80, height: 80, borderRadius: 40, zIndex: 10 },
	legend: {
		marginTop: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		flexWrap: 'wrap',
		gap: 12,
	},
	legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 160 },
	legendSwatch: { width: 10, height: 10, borderRadius: 2 },
	legendText: { fontSize: 12, color: '#aaa', flexShrink: 1 },
	matchupRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 7,
	},
	matchupName: { flex: 1, fontSize: 14, marginRight: 12 },
	matchupStats: { fontSize: 13, color: '#888' },
	tooltip: {
		position: 'absolute',
		zIndex: 1000,
		backgroundColor: '#444',
		borderRadius: 6,
		paddingHorizontal: 10,
		paddingVertical: 7,
		minWidth: 80,
		maxWidth: 170,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 6,
	},
	tooltipText: { color: '#fff', fontSize: 12 },
	listRow: { paddingVertical: 4, fontSize: 14 },
	empty: { color: '#888', fontSize: 13 },
});
