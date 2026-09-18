import { useEffect, useRef, useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { Text, TextInput, Button, Modal, Portal, useTheme } from 'react-native-paper';
import { Autocomplete, AutocompleteScrollView } from 'react-native-paper-autocomplete';
import { fetchSuggestions } from '@/api/scryfall';
import { useDecksStore } from '@/store/useDecksStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

type CommanderOption = { id: string; label: string };

export default function DecksScreen() {
	const { decks, loading, loadDecks, addDeck } = useDecksStore();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState(false);
	const [name, setName] = useState('');
	const [commander, setCommander] = useState('');
	const [commanderOptions, setCommanderOptions] = useState<CommanderOption[]>([]);
	const [saving, setSaving] = useState(false);

	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestId = useRef(0);

	useEffect(() => {
		loadDecks();

		return () => {
			if (searchTimer.current) {
				clearTimeout(searchTimer.current);
			}
		};
	}, []);

	const searchCommanders = (query: string) => {
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
			const suggestions = await fetchSuggestions(trimmedQuery);

			if (currentRequest === requestId.current) {
				setCommanderOptions(
					suggestions.map((suggestion) => ({ id: suggestion, label: suggestion })),
				);
			}
		}, 300);
	};

	const handleAdd = async () => {
		const trimmedName = name.trim();
		const trimmedCommander = commander.trim();

		if (!trimmedName || !trimmedCommander) {
			return;
		}

		setSaving(true);

		try {
			await addDeck(trimmedName, trimmedCommander, true);

			setName('');
			setCommander('');
			setCommanderOptions([]);
			setModalVisible(false);
		} finally {
			setSaving(false);
		}
	};

	const myDecks = decks.filter((deck) => deck.isUsers);
	const genericDecks = decks.filter((deck) => !deck.isUsers);
	console.log(genericDecks.length);

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={[theme.colors.primary, theme.colors.secondary]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.addButtonGradient}>
				<Button
					mode='contained'
					onPress={() => setModalVisible(true)}
					style={styles.addButton}
					contentStyle={styles.addButtonContent}>
					<View style={styles.addButtonRow}>
						<Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>NEW DECK</Text>
						<Ionicons name='duplicate-sharp' size={22} color={theme.colors.onPrimary} />
					</View>
				</Button>
			</LinearGradient>

			<Portal>
				<Modal
					visible={modalVisible}
					onDismiss={() => setModalVisible(false)}
					contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
					<Text variant='headlineSmall'>Add deck</Text>

					<TextInput
						label='Deck name'
						mode='outlined'
						value={name}
						onChangeText={setName}
						style={styles.input}
					/>

					<AutocompleteScrollView>
						<Autocomplete
							options={commanderOptions}
							value={commander ? { id: commander, label: commander } : undefined}
							onChange={(option) => {
								setCommander(option?.label ?? '');
							}}
							inputProps={{
								label: 'Commander',
								placeholder: 'Search for a commander',
								onChangeText: (query) => {
									setCommander(query);
									searchCommanders(query);
								},
							}}
						/>
					</AutocompleteScrollView>

					<View style={styles.modalActions}>
						<Button mode='text' onPress={() => setModalVisible(false)} disabled={saving}>
							Cancel
						</Button>

						<Button
							mode='contained'
							onPress={handleAdd}
							loading={saving}
							disabled={!name.trim() || !commander.trim() || saving}>
							Add
						</Button>
					</View>
				</Modal>
			</Portal>

			<View style={styles.listSection}>
				<Text variant='titleMedium' style={styles.sectionTitle}>
					My Decks:
				</Text>
				<FlatList
					data={myDecks}
					nestedScrollEnabled
					keyExtractor={(item) => String(item.id)}
					refreshing={loading}
					onRefresh={loadDecks}
					style={styles.deckList}
					ListEmptyComponent={<Text style={styles.empty}>No decks yet.</Text>}
					renderItem={({ item }) => (
						<Link href={`/decks/${item.id}`} asChild>
							<Pressable
								style={{
									...styles.row,
									backgroundColor: theme.colors.surface,
									borderColor: theme.colors.outline,
								}}>
								<Text variant='titleMedium' style={{ color: theme.colors.primary }}>
									{item.name}
								</Text>
								{item.commander && <Text style={styles.meta}>{item.commander}</Text>}
							</Pressable>
						</Link>
					)}
				/>
			</View>

			<View style={styles.listSection}>
				<Text variant='titleMedium' style={styles.sectionTitle}>
					Generic Decks:
				</Text>
				<FlatList
					data={genericDecks}
					keyExtractor={(item) => String(item.id)}
					refreshing={loading}
					onRefresh={loadDecks}
					nestedScrollEnabled
					style={styles.deckList}
					ListEmptyComponent={<Text style={styles.empty}>No decks yet.</Text>}
					renderItem={({ item }) => (
						<Link href={`/decks/${item.id}`} asChild>
							<Pressable
								style={{
									...styles.row,
									backgroundColor: theme.colors.surface,
									borderColor: theme.colors.outline,
								}}>
								<Text variant='titleMedium' style={{ color: theme.colors.primary }}>
									{item.name}
								</Text>
								{item.commander && <Text style={styles.meta}>{item.commander}</Text>}
							</Pressable>
						</Link>
					)}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	sectionTitle: { marginBottom: 12 },
	container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
	modal: { margin: 20, padding: 20, borderRadius: 8, gap: 12 },
	input: { backgroundColor: 'transparent' },
	modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
	row: { paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1 },
	meta: { fontSize: 12, marginTop: 2 },
	empty: { textAlign: 'center', marginTop: 40, color: '#888' },
	listSection: { flex: 1, minHeight: 0 },
	deckList: { flex: 1 },
	addButtonGradient: { marginBottom: 16, borderRadius: 4, overflow: 'hidden', width: '100%' },
	addButton: { backgroundColor: 'transparent', borderRadius: 4 },
	addButtonContent: { height: 48, paddingHorizontal: 12 },
	addButtonRow: {
		flex: 1,
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	addButtonText: { fontSize: 20, fontWeight: '700' },
});
