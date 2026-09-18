import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { fetchSuggestions } from '@/api/scryfall';
import { Deck } from '@/lib/db';
import { fonts, ink, onRules, RULE_SPACING, screenPadding, wrapOnRules } from '@/lib/notebook';
import { Txt } from '@/components/notebook/Hand';
import { PenButton } from '@/components/notebook/PenButton';
import { ChevronDown, Handle } from '@/components/notebook/PenIcons';
import { PickerOption, PickerSheet } from '@/components/notebook/PickerSheet';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { deckMeta, displayDeckName, Seat } from './model';

const MAX_DECK_OPTIONS = 8;

type Props = {
	seats: Seat[];
	setSeats: (seats: Seat[]) => void;
	decks: Deck[];
	gameCounts: Record<number, number>;
	onCreateDeck: (name: string, commander: string) => Promise<number>;
	onNext: () => void;
	error: string | null;
};

export function SeatsStep({ seats, setSeats, decks, gameCounts, onCreateDeck, onNext, error }: Props) {
	const [pickingKey, setPickingKey] = useState<number | null>(null);
	const [query, setQuery] = useState('');
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [scrollOffset, setScrollOffset] = useState(0);

	const pickingSeat = seats.find((seat) => seat.key === pickingKey);
	const pickingMine = pickingSeat?.isUsers ?? false;

	// Commander search for opponent seats, debounced; ignores responses for queries that have since changed.
	useEffect(() => {
		const trimmed = query.trim();
		if (pickingMine || trimmed.length < 2) {
			setSuggestions([]);
			return;
		}
		let stale = false;
		const timer = setTimeout(() => {
			fetchSuggestions(trimmed).then((names) => !stale && setSuggestions(names));
		}, 300);
		return () => {
			stale = true;
			clearTimeout(timer);
		};
	}, [query, pickingMine]);

	// Your seat picks from your decks; opponent seats pick from decks faced before, or any
	// commander from Scryfall, which is added as a new generic deck.
	const deckOptions = useMemo((): PickerOption[] => {
		const q = query.trim().toLowerCase();
		const takenIds = new Set(seats.filter((s) => s.key !== pickingKey).map((s) => s.deckId));
		const existing = decks
			.filter((deck) => deck.isUsers === pickingMine && !takenIds.has(deck.id))
			.filter(
				(deck) =>
					!q || deck.name.toLowerCase().includes(q) || deck.commander?.toLowerCase().includes(q),
			)
			.sort((a, b) => (gameCounts[b.id] ?? 0) - (gameCounts[a.id] ?? 0))
			.slice(0, MAX_DECK_OPTIONS);

		const options: PickerOption[] = existing.map((deck) => ({
			key: `deck:${deck.id}`,
			label: displayDeckName(deck.name),
			meta: deckMeta(deck, gameCounts[deck.id] ?? 0),
			color: pickingMine ? ink.blue : ink.ink,
		}));
		if (pickingMine) return options;

		const knownCommanders = new Set(decks.map((deck) => deck.commander));
		const fresh = suggestions.filter((name) => !knownCommanders.has(name)).slice(0, MAX_DECK_OPTIONS);
		return [...options, ...fresh.map((name) => ({ key: `new:${name}`, label: name, meta: '+ add new' }))];
	}, [decks, seats, pickingKey, pickingMine, query, suggestions, gameCounts]);

	const closePicker = () => {
		setPickingKey(null);
		setQuery('');
	};

	const updateSeat = (key: number, patch: Partial<Seat>) =>
		setSeats(seats.map((seat) => (seat.key === key ? { ...seat, ...patch } : seat)));

	const handlePick = async (optionKey: string) => {
		const key = pickingKey;
		closePicker();
		if (key === null) return;

		if (optionKey.startsWith('deck:')) {
			const deck = decks.find((d) => d.id === Number(optionKey.slice(5)));
			if (deck) updateSeat(key, { deckId: deck.id, deckName: deck.name });
		} else {
			const commander = optionKey.slice(4);
			const name = `${commander} (Generic)`;
			const id = await onCreateDeck(name, commander);
			updateSeat(key, { deckId: id, deckName: name });
		}
	};

	const renderSeat = ({ item: seat, drag, getIndex }: RenderItemParams<Seat>) => {
		const index = getIndex() ?? 0;
		const filled = seat.deckId !== null;
		const numberColor = seat.isUsers ? ink.blue : filled ? ink.ink : ink.faint;

		return (
			<View style={styles.seatRow}>
				<Txt style={[styles.seatNumber, { color: numberColor }]}>{index + 1}.</Txt>
				<Pressable style={styles.seatBody} onPress={() => setPickingKey(seat.key)}>
					{filled ?
						<>
							<Txt style={styles.deckName} numberOfLines={1}>
								{displayDeckName(seat.deckName)}
							</Txt>
							<Txt style={styles.deckMeta}>
								{deckMeta(seat, gameCounts[seat.deckId!] ?? 0)}
							</Txt>
						</>
					:	<View style={styles.pickLine}>
							<Txt style={styles.pickText}>{seat.isUsers ? 'pick your deck' : 'pick a deck'}</Txt>
							<View style={styles.pickChevron}>
								<ChevronDown />
							</View>
							<Rule color={ink.faint} width={1.5} />
						</View>
					}
				</Pressable>
				<Pressable style={styles.handle} onLongPress={drag} delayLongPress={150} hitSlop={8}>
					<Handle />
				</Pressable>
				{index < seats.length - 1 && <Rule width={1.5} />}
			</View>
		);
	};

	return (
		<>
			{/* The drag list is the scroller (nesting it in a ScrollView breaks its measuring on the new
			    architecture), so the paper sits behind it and follows the scroll offset. */}
			<View style={styles.screen}>
				<RuledPaper margin scrollOffset={scrollOffset} />
				<DraggableFlatList
					data={seats}
					keyExtractor={(seat) => String(seat.key)}
					renderItem={renderSeat}
					onDragEnd={({ data }) => setSeats(data)}
					onScrollOffsetChange={setScrollOffset}
					containerStyle={styles.screen}
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps='handled'
					ListHeaderComponent={
						<>
							<Txt style={styles.title}>Who's playing?</Txt>
							<Txt style={styles.body}>
								Write them down in turn order — whoever went first at the top. The blue seat is
								you. Hold the lines on the right to move someone.
							</Txt>
							<View style={styles.gap} />
						</>
					}
					ListFooterComponent={
						<>
							<View style={styles.gap} />
							{error && <Txt style={styles.error}>{error}</Txt>}
							<PenButton label='start the game' onPress={onNext} />
						</>
					}
				/>
			</View>

			<PickerSheet
				visible={pickingKey !== null}
				title={pickingMine ? 'Which deck did you play?' : 'Who were they playing?'}
				options={deckOptions}
				onPick={handlePick}
				onClose={closePicker}
				onClear={
					pickingSeat?.deckId != null ?
						() => {
							updateSeat(pickingSeat.key, { deckId: null, deckName: '' });
							closePicker();
						}
					:	undefined
				}
				search={{
					value: query,
					onChange: setQuery,
					placeholder: pickingMine ? 'your deck...' : 'search a commander...',
				}}
				emptyText={
					pickingMine ? 'none of yours match — add decks on the decks tab'
					: query.trim().length < 2 ? 'type a commander to add one'
					: 'nothing found'
				}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1 },
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	gap: { height: RULE_SPACING },
	title: { ...onRules(fonts.caveat700, 34, 2), color: ink.blue },
	body: { ...wrapOnRules(fonts.kalam300, 14), color: ink.body },
	error: { ...wrapOnRules(fonts.caveat500, 20), color: ink.red },

	seatRow: { flexDirection: 'row', height: RULE_SPACING * 2 },
	seatNumber: { width: 34, ...onRules(fonts.caveat700, 26) },
	seatBody: { flex: 1 },
	deckName: { ...onRules(fonts.caveat600, 22), color: ink.ink },
	deckMeta: { ...onRules(fonts.kalam300, 12), color: ink.faint },
	pickLine: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING, paddingRight: 4 },
	pickChevron: { marginTop: 14 },
	pickText: { flex: 1, ...onRules(fonts.caveat500, 22), color: ink.faint },
	handle: { width: 36, height: RULE_SPACING, alignItems: 'flex-end', justifyContent: 'center' },
});
