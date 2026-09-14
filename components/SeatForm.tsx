import { View, TextInput as RNTextInput, StyleSheet, Pressable } from 'react-native';
import { Text, Switch, useTheme } from 'react-native-paper';
import { Deck, Tag } from '@/lib/db';
import { Autocomplete, AutocompleteScrollView } from 'react-native-paper-autocomplete';
import { useEffect, useRef, useState } from 'react';
import { fetchSuggestions } from '@/api/scryfall';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Circle } from 'victory-native';
import { Svg } from 'react-native-svg';

export type SeatFormValue = {
	index: number;
	deckId: number | null;
	deckName: string;
	placement: number | null;
	is_winner: boolean;
	endGameTurn: string; // kept as string for the input, parsed on submit
	winCondition: string;
	eliminationReason: string;
	commentTagIds: number[];
	isUser: boolean;
};

type Props = {
	value: SeatFormValue;
	onChange: (value: SeatFormValue) => void;
	decks: Deck[];
	onCreateDeck: (name: string, commander: string) => Promise<{ id: number; name: string }>;
	drag: () => void;
};

export function SeatForm({ value, onChange, decks, onCreateDeck, drag }: Props) {
	const theme = useTheme();

	const [commanderOptions, setCommanderOptions] = useState<{ id: number; label: string }[]>([]);

	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestId = useRef(0);
	const selectedDeck = value.deckId ? { id: value.deckId, label: value.deckName } : undefined;
	const myDecks = decks.filter((d) => d.isUsers);

	const getOptions = async (query: string) => {
		if (searchTimer.current) {
			clearTimeout(searchTimer.current);
		}

		const trimmedQuery = query.trim();

		if (trimmedQuery.length < 2) {
			requestId.current += 1;
			setCommanderOptions([]);
			return;
		}

		searchTimer.current = setTimeout(async () => {
			const currentRequest = ++requestId.current;
			const commanders = await fetchSuggestions(trimmedQuery);

			if (currentRequest === requestId.current) {
				setCommanderOptions(
					commanders.map((commander, index) => ({ id: index, label: commander })),
				);
			}
		}, 300);
	};

	const handleDeckChange = (option: { id: number; label: string } | undefined) => {
		if (option) {
			const existingDeck = decks.find((d) => d.commander === option.label);
			if (!existingDeck) {
				onCreateDeck(option.label + ' (Generic)', option.label).then((newDeck) => {
					onChange({ ...value, deckId: newDeck.id, deckName: newDeck.name });
				});
			} else {
				onChange({ ...value, deckId: existingDeck.id, deckName: existingDeck.name });
			}
		} else {
			onChange({ ...value, deckId: null, deckName: '' });
		}
	};

	useEffect(() => {
		return () => {
			if (searchTimer.current) {
				clearTimeout(searchTimer.current);
			}
		};
	}, []);

	return (
		<View style={styles.container}>
			<View>
				<Text>{value.index}</Text>
			</View>
			<AutocompleteScrollView>
				{value.index === 1 && (
					<Autocomplete
						onChange={(newValue) => {
							if (newValue) {
								onChange({ ...value, deckId: newValue.id, deckName: newValue.label });
							} else {
								onChange({ ...value, deckId: null, deckName: '' });
							}
						}}
						value={selectedDeck}
						getOptionValue={(option) => String(option.id)}
						options={myDecks.map((d) => ({ id: d.id, label: d.name }))}
						inputProps={{ placeholder: 'Select your deck...' }}
						style={{ maxHeight: 200 }}
					/>
				)}

				{value.index != 1 && (
					<Autocomplete
						onChange={handleDeckChange}
						value={selectedDeck}
						getOptionValue={(option) => String(option.id)}
						options={commanderOptions}
						inputProps={{ placeholder: 'Select a deck...', onChangeText: getOptions }}
						style={{ maxHeight: 200 }}
					/>
				)}
			</AutocompleteScrollView>
			<Pressable onLongPress={drag} delayLongPress={150}>
				<Svg width={24} height={32} viewBox='0 0 24 32'>
					{[0, 1, 2, 3].map((row) =>
						[0, 1].map((column) => (
							<Circle
								key={`${row}-${column}`}
								cx={7 + column * 10}
								cy={4 + row * 8}
								r={2.2}
								fill={theme.colors.tertiary}
							/>
						)),
					)}
				</Svg>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
		paddingBottom: 16,
		gap: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: '#666',
		flexDirection: 'row',
	},
	title: { marginBottom: 8 },
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginVertical: 10,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 8,
	},
	label: { fontSize: 12, color: '#666', marginTop: 8, marginBottom: 6 },
});
