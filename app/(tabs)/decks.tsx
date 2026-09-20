import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Deck, DeckRecord, getDeckRecords, POD_SIZE } from '@/lib/db';
import {
	fonts,
	ink,
	labelText,
	hangOnRules,
	onRules,
	RULE_SPACING,
	screenPadding,
} from '@/lib/notebook';
import { useDecksStore } from '@/store/useDecksStore';
import { NewDeckSheet } from '@/components/decks/NewDeckSheet';
import { Txt } from '@/components/notebook/Hand';
import { PenButton } from '@/components/notebook/PenButton';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';

type Filter = 'mine' | 'all';

// In a four-player pod an even share of wins is 25%: above it is written in blue, below in red.
const PAR_WIN_RATE = 100 / POD_SIZE;

type DeckRow = Deck & { games: number; wins: number; rate: number };

export default function DecksScreen() {
	const { decks, loadDecks, addDeck } = useDecksStore();
	const [records, setRecords] = useState<DeckRecord[]>([]);
	const [filter, setFilter] = useState<Filter>('mine');
	const [adding, setAdding] = useState(false);

	// Tabs stay mounted, so reload on focus to pick up games logged since.
	useFocusEffect(
		useCallback(() => {
			loadDecks();
			getDeckRecords().then(setRecords);
		}, []),
	);

	const rows: DeckRow[] = decks
		.filter((deck) => filter === 'all' || deck.isUsers)
		.map((deck) => {
			const record = records.find((r) => r.deck_id === deck.id);
			const games = record?.games ?? 0;
			const wins = record?.wins ?? 0;
			return { ...deck, games, wins, rate: games > 0 ? Math.round((wins / games) * 100) : 0 };
		})
		// Played decks by win rate, then unplayed ones.
		.sort(
			(a, b) => Number(b.games > 0) - Number(a.games > 0) || b.rate - a.rate || b.games - a.games,
		);

	const handleSave = async (name: string, commander: string) => {
		await addDeck(name, commander, true);
		getDeckRecords().then(setRecords);
	};

	return (
		<>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<RuledPaper />

				<View style={styles.filterRow}>
					<FilterTab
						label='my decks'
						active={filter === 'mine'}
						onPress={() => setFilter('mine')}
					/>
					<FilterTab label='all decks' active={filter === 'all'} onPress={() => setFilter('all')} />
					<View style={styles.flex} />
					<Txt style={labelText}>
						{rows.length} {rows.length === 1 ? 'deck' : 'decks'}
					</Txt>
				</View>
				<View style={styles.gap} />

				{rows.length === 0 ?
					<Txt style={styles.empty}>
						{filter === 'mine' ? 'no decks yet — start one below.' : 'no decks yet.'}
					</Txt>
				:	rows.map((row, index) => (
						<Pressable
							key={row.id}
							style={styles.deckRow}
							onPress={() => router.push(`/decks/${row.id}`)}>
							<View style={styles.flex}>
								<Txt style={styles.name} numberOfLines={1}>
									{row.name}
								</Txt>
								<Txt style={styles.meta} numberOfLines={1}>
									{deckMeta(row)}
								</Txt>
							</View>
							<View style={styles.rateColumn}>
								<Txt style={[styles.rate, { color: rateColor(row) }]}>
									{row.games > 0 ? `${row.rate}%` : '—'}
								</Txt>
								<Txt style={styles.record}>
									{row.wins}–{row.games - row.wins}
								</Txt>
							</View>
						</Pressable>
					))
				}

				<View style={styles.gap} />
				<PenButton label='+ start a new deck' onPress={() => setAdding(true)} />
			</ScrollView>

			<NewDeckSheet visible={adding} onClose={() => setAdding(false)} onSave={handleSave} />
		</>
	);
}

// Written like a section title; the active one is in ink and underlined, the other faint.
function FilterTab({
	label,
	active,
	onPress,
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable onPress={onPress} accessibilityRole='tab' accessibilityState={{ selected: active }}>
			<SectionTitle color={active ? ink.ink : ink.faint} underline={active}>
				{label}
			</SectionTitle>
		</Pressable>
	);
}

// "<commander> · 5 games" for your decks; opponents' decks are usually named after their
// commander, so only repeat it when it differs.
function deckMeta(row: DeckRow) {
	const parts: string[] = [];
	if (row.commander && row.commander !== row.name) parts.push(row.commander);
	if (!row.isUsers) parts.push('opponent');
	parts.push(
		row.games === 0 ? 'no games yet'
		: row.isUsers ? `${row.games} ${row.games === 1 ? 'game' : 'games'}`
		: `faced ${row.games}×`,
	);
	return parts.join(' · ');
}

function rateColor(row: DeckRow) {
	if (row.games === 0) return ink.faint;
	if (row.rate > PAR_WIN_RATE) return ink.blue;
	if (row.rate < PAR_WIN_RATE) return ink.red;
	return ink.ink;
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: ink.paper },
	// Every block is a whole number of ruled lines tall, so text stays on the rules.
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	gap: { height: RULE_SPACING },
	flex: { flex: 1 },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },

	filterRow: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING, gap: 14 },

	deckRow: { flexDirection: 'row', height: RULE_SPACING * 2 },
	name: { ...onRules(fonts.caveat600, 24), color: ink.ink },
	meta: { ...hangOnRules(fonts.kalam300, 12), color: ink.body },
	rateColumn: { alignItems: 'flex-end', marginLeft: 8 },
	rate: onRules(fonts.caveat700, 28),
	record: { ...hangOnRules(fonts.kalam300, 12), color: ink.faint },
});
