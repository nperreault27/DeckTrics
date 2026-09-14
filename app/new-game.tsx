import { useEffect, useState } from 'react';
import { FlatList, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, Button, HelperText } from 'react-native-paper';
import { useDecksStore } from '@/store/useDecksStore';
import { useGamesStore } from '@/store/useGamesStore';
import { listTagsByCategory, Tag, POD_SIZE, SeatInput } from '@/lib/db';
import { SeatForm, SeatFormValue } from '@/components/SeatForm';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { Pressable } from 'react-native-gesture-handler';
import { TurnInputScreen } from '@/components/TurnInputScreen';
import { PostGameInputScreen } from '@/components/PostGameInputScreen';

const emptySeat: SeatFormValue = {
	index: 0,
	deckId: null,
	deckName: '',
	placement: null,
	is_winner: false,
	endGameTurn: '',
	winCondition: '',
	eliminationReason: '',
	commentTagIds: [],
	isUser: false,
};

type Stage = 'setup' | 'midgame' | 'postgame';

export default function NewGameScreen() {
	const router = useRouter();
	const { decks, loadDecks, addDeck } = useDecksStore();
	const { logGame } = useGamesStore();

	const [inputStage, setInputStage] = useState<Stage>('setup');
	const [totalTurns, setTotalTurns] = useState('');
	const [seats, setSeats] = useState<SeatFormValue[]>(
		Array.from({ length: POD_SIZE }, (_, index) => ({
			...emptySeat,
			index: index + 1,
			isUser: index === 0,
		})),
	);
	const [gameEndReasons, setGameEndReasons] = useState<Tag[]>([]);
	const [commentTags, setCommentTags] = useState<Tag[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			await Promise.all([
				loadDecks(),
				listTagsByCategory('game_end_reason').then(setGameEndReasons),
				listTagsByCategory('comment').then(setCommentTags),
			]);
		};
		loadData().catch((error) => {
			console.error('Failed to load new game data:', error);
		});
	}, []);

	const updateSeat = (value: SeatFormValue) => {
		setSeats((prev) => prev.map((s) => (value.index === s.index ? value : s)));
		console.log('updated');
	};

	const handleCreateDeck = async (name: string, commander: string) => {
		const id = await addDeck(name, commander);
		return { id, name };
	};

	const handleSubmit = async () => {
		setError(null);
		setSubmitting(true);

		const seatInputs: SeatInput[] = seats.map((s, i) => {
			const placement =
				s.is_winner ? 1 : (
					2 +
					seats.filter(
						(other) => !other.is_winner && Number(other.endGameTurn) > Number(s.endGameTurn),
					).length
				);
			const conditionId = gameEndReasons.find(
				(reason) => reason.label === (placement === 1 ? s.winCondition : s.eliminationReason),
			)!.id;
			return {
				deckId: s.deckId as number,
				turnOrder: s.index,
				placement,
				eliminatedTurn: placement === 1 ? null : parseInt(s.endGameTurn, 10),
				winConditionId: placement === 1 ? conditionId : null,
				eliminationReasonId: placement !== 1 ? conditionId : null,
				commentTagIds: s.commentTagIds,
			};
		});

		try {
			await logGame({ totalTurns: parseInt(totalTurns, 10), seats: seatInputs });
			router.push('/(tabs)');
		} catch (e) {
			setError('Something went wrong saving the game. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleStageSetup = () => {
		const seatsWithID = seats.filter((seat) => seat.deckId !== null);
		if (seatsWithID.length !== 4) {
			setError('Decks cannot be empty');
			return;
		}
		setError(null);
		setSeats((prev) => prev.map((s, i) => ({ ...s, index: i + 1 })));
		setInputStage('midgame');
	};

	const handleStageMidGame = () => {
		const winner = seats.filter((seat) => seat.is_winner);
		const reasons = seats.filter((seat) => seat.eliminationReason || seat.winCondition);

		if (!winner.length) {
			setError('Someone must have won.');
			return;
		}
		if (reasons.length !== 4) {
			setError('Make sure everyone has a reason they lost');
			return;
		}
		setError(null);
		seats.forEach;
		setInputStage('postgame');
	};

	const handlePostGame = async () => {
		const userSeat = seats.find((seat) => seat.isUser)!;
		if (userSeat.commentTagIds.length === 0) {
			setError('Select at least one option');
			return;
		}
		setError(null);
		await handleSubmit();
	};

	return (
		<>
			{inputStage === 'setup' && (
				<>
					<Text style={{ fontSize: 20, fontWeight: 400, padding: 8 }}>
						Order the decks in turn order:
					</Text>
					<DraggableFlatList
						contentContainerStyle={styles.container}
						data={seats}
						keyExtractor={(item) => item.index.toString()}
						renderItem={({ item: seat, drag }) => (
							<SeatForm
								value={seat}
								onChange={(value) => updateSeat(value)}
								decks={decks}
								drag={drag}
								onCreateDeck={handleCreateDeck}
							/>
						)}
						onDragEnd={({ data }) => {
							setSeats(data);
						}}
						ListFooterComponent={
							<>
								{error && <HelperText type='error'>{error}</HelperText>}
								<Button
									mode='contained'
									onPress={handleStageSetup}
									loading={submitting}
									disabled={submitting}
									style={{ borderRadius: 8 }}>
									Start Game
								</Button>
							</>
						}
					/>
				</>
			)}
			{inputStage === 'midgame' && (
				<>
					<TurnInputScreen
						seats={seats}
						gameEndReasons={gameEndReasons}
						updateSeats={updateSeat}
						setTotalTurns={setTotalTurns}
						handleStageMidGame={handleStageMidGame}
						error={error}
					/>
				</>
			)}
			{inputStage === 'postgame' && (
				<PostGameInputScreen
					updateSeat={updateSeat}
					seats={seats}
					commentTags={commentTags}
					handlePostGame={handlePostGame}
					error={error}
					submitting={submitting}
				/>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 48 },
	label: { fontSize: 12, marginBottom: 6 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		marginBottom: 20,
	},
});
