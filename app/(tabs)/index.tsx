import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useGamesStore } from '@/store/useGamesStore';
import { useDecksStore } from '@/store/useDecksStore';
import { GameListItem } from '@/lib/db';
import { seedTestData } from '@/lib/seedTestData';
import { Txt } from '@/components/notebook/Hand';
import { RuledPaper, Rule } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import {
	fonts,
	handDrawnRadius,
	ink,
	labelText,
	onRules,
	overhang,
	RULE_SPACING,
	screenPadding,
} from '@/lib/notebook';

const RECENT_COUNT = 5;

const getPlacementText = (placement: number) => {
	switch (placement) {
		case 1:
			return '1st';
		case 2:
			return '2nd';
		case 3:
			return '3rd';
		default:
			return `${placement}th`;
	}
};

// Game-end tag labels as they read after "won on" / "lost to".
const END_PHRASES: Record<string, { won: string; lost: string }> = {
	'Combat damage': { won: 'won on combat damage', lost: 'lost to combat damage' },
	'Commander damage': { won: 'won on commander damage', lost: 'lost to commander damage' },
	'Combo kill': { won: 'won with a combo', lost: 'lost to a combo kill' },
	'Mill / decked out': { won: 'won by milling out', lost: 'decked out' },
	'Alternate win condition': { won: 'won with an alt win con', lost: 'lost to an alt win con' },
	'Direct damage / burn': { won: 'won on burn', lost: 'lost to burn' },
	'Poison / infect': { won: 'won on poison', lost: 'lost to poison' },
	Concession: { won: 'won by concession', lost: 'conceded' },
};

const describeEnding = (game: GameListItem) => {
	const won = game.placement === 1;
	const phrase =
		game.end_reason && END_PHRASES[game.end_reason] ?
			END_PHRASES[game.end_reason][won ? 'won' : 'lost']
		: won ? 'won'
		: 'lost';
	const turn = won ? game.total_turns : (game.eliminated_turn ?? game.total_turns);
	return `${phrase}, turn ${turn} — seat ${game.turn_order}`;
};

export default function HomeScreen() {
	const { games, loading, loadGames } = useGamesStore();
	const { decks, loadDecks } = useDecksStore();
	const [showAll, setShowAll] = useState(false);
	const [seeding, setSeeding] = useState(false);

	useEffect(() => {
		loadGames();
		loadDecks();
	}, []);

	const totalGames = games.length;
	const totalWins = games.filter((game) => game.placement === 1).length;
	const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
	const avgTurns =
		totalGames > 0 ?
			Math.round(games.reduce((sum, game) => sum + game.total_turns, 0) / totalGames)
		:	0;
	const userDeckCount = decks.filter((deck) => deck.isUsers).length;
	const visibleGames = showAll ? games : games.slice(0, RECENT_COUNT);

	const handleSeed = async () => {
		setSeeding(true);
		try {
			await seedTestData();
			await Promise.all([loadGames(), loadDecks()]);
		} finally {
			setSeeding(false);
		}
	};

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={styles.content}
			refreshControl={
				<RefreshControl refreshing={loading} onRefresh={loadGames} tintColor={ink.blue} />
			}>
			<RuledPaper />
			<Txt style={labelText}>Win rate</Txt>
			<View style={styles.hero}>
				<Txt style={styles.heroNumber}>{winRate}%</Txt>
			</View>

			<View style={styles.statRow}>
				<Stat label='Games' value={`${totalGames}`} />
				<Stat label='Avg length' value={`${avgTurns} turns`} />
				<Stat label='Decks' value={`${userDeckCount}`} />
			</View>

			<Pressable style={styles.logButton} onPress={() => router.push('/new-game')}>
				<View style={styles.logButtonOutline} />
				<Txt style={styles.logButtonText}>+ write down a game</Txt>
			</Pressable>

			<View style={styles.sectionHead}>
				<SectionTitle>Games played</SectionTitle>
				{!showAll && totalGames > RECENT_COUNT && (
					<Pressable style={styles.allLink} onPress={() => setShowAll(true)}>
						<Txt style={styles.allLinkText}>all {totalGames}</Txt>
						<PenArrow />
					</Pressable>
				)}
			</View>

			{totalGames === 0 ?
				<View>
					<Txt style={styles.empty}>nothing written down yet.</Txt>
					{__DEV__ && (
						<Pressable onPress={handleSeed} disabled={seeding} style={styles.seedLink}>
							<Txt style={styles.seedLinkText}>
								{seeding ? 'scribbling...' : 'fill in some test games'}
							</Txt>
							<Rule color={ink.red} width={1.5} />
						</Pressable>
					)}
				</View>
			:	visibleGames.map((game, index) => (
					<View key={game.seat_id} style={styles.gameRow}>
						<Txt
							style={[styles.placement, { color: game.placement === 1 ? ink.blue : ink.red }]}
							numberOfLines={1}>
							{getPlacementText(game.placement)}
						</Txt>
						<View style={styles.gameBody}>
							<Txt style={styles.deckName} numberOfLines={1}>
								{game.deck_name}
							</Txt>
							<Txt style={styles.ending} numberOfLines={1}>
								{describeEnding(game)}
							</Txt>
						</View>
						{index < visibleGames.length - 1 && <Rule width={1.5} />}
					</View>
				))
			}
		</ScrollView>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<View>
			<Txt style={labelText}>{label}</Txt>
			<Txt style={styles.statValue}>{value}</Txt>
		</View>
	);
}

// Hand-curved arrow, drawn rather than typed.
function PenArrow() {
	return (
		<Svg width={24} height={14} viewBox='0 0 24 14' style={{ marginTop: 16 }}>
			<Path
				d='M1.5 7.6 C 7 6.4, 14 7.8, 21.5 6.8 M16.5 2.2 C 18.5 4, 20 5.4, 21.8 6.8 C 20 8.2, 18.2 9.8, 16.8 11.6'
				stroke={ink.blue}
				strokeWidth={1.8}
				strokeLinecap='round'
				strokeLinejoin='round'
				fill='none'
			/>
		</Svg>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: ink.paper },
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	hero: { flexDirection: 'row', height: RULE_SPACING * 2 },
	heroNumber: {
		...onRules(fonts.caveat700, 82, 2),
		transform: [{ translateY: -3 }],
		color: ink.blue,
	},
	fraction: { marginLeft: 4 - overhang(82), alignItems: 'center' },
	fractionText: { ...onRules(fonts.caveat500, 24), paddingHorizontal: 3, color: ink.ink },
	fractionBar: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: RULE_SPACING + 4,
		height: 1.5,
		backgroundColor: ink.ink,
	},
	statRow: { flexDirection: 'row', gap: 22 - overhang(30) },
	statValue: { ...onRules(fonts.caveat700, 30), color: ink.ink },
	logButton: { marginTop: RULE_SPACING, height: RULE_SPACING * 2, alignItems: 'center' },
	logButtonOutline: {
		...StyleSheet.absoluteFillObject,
		...handDrawnRadius,
		borderWidth: 2.5,
		borderColor: ink.blue,
	},
	logButtonText: { ...onRules(fonts.caveat700, 26), color: ink.blue },
	sectionHead: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginTop: RULE_SPACING,
	},
	allLink: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
	allLinkText: { ...onRules(fonts.caveat600, 21), color: ink.blue },
	gameRow: { flexDirection: 'row' },
	placement: { width: 44 + overhang(30), ...onRules(fonts.caveat700, 30) },
	gameBody: { flex: 1, marginLeft: 12 - overhang(30) },
	deckName: { ...onRules(fonts.caveat600, 24), color: ink.ink },
	ending: { ...onRules(fonts.kalam300, 14), color: ink.body },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },
	seedLink: { alignSelf: 'flex-start' },
	seedLinkText: { ...onRules(fonts.caveat600, 20), color: ink.red },
});
