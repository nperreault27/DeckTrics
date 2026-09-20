import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDecksStore } from '@/store/useDecksStore';
import { useGamesStore } from '@/store/useGamesStore';
import { getDeckGameCounts, listTagsByCategory, POD_SIZE, SeatInput, Tag } from '@/lib/db';
import { ink } from '@/lib/notebook';
import { PageHead } from '@/components/notebook/PageHead';
import { SeatsStep } from '@/components/log-game/SeatsStep';
import { TurnsStep } from '@/components/log-game/TurnsStep';
import { AfterStep } from '@/components/log-game/AfterStep';
import { emptySeat, placementOf, Seat } from '@/components/log-game/model';

const STEPS = [
	{ key: 'seats', label: 'new entry' },
	{ key: 'turns', label: 'in progress' },
	{ key: 'after', label: 'after the game' },
] as const;

export default function NewGameScreen() {
	const router = useRouter();
	const { decks, loadDecks, addDeck } = useDecksStore();
	const { logGame } = useGamesStore();

	const [step, setStep] = useState(0);
	const [seats, setSeats] = useState<Seat[]>(() => Array.from({ length: POD_SIZE }, (_, i) => emptySeat(i, i === 0)));
	const [turn, setTurn] = useState(1);
	const [commentTagIds, setCommentTagIds] = useState<number[]>([]);
	const [gameEndReasons, setGameEndReasons] = useState<Tag[]>([]);
	const [commentTags, setCommentTags] = useState<Tag[]>([]);
	const [gameCounts, setGameCounts] = useState<Record<number, number>>({});
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		Promise.all([
			loadDecks(),
			listTagsByCategory('game_end_reason').then(setGameEndReasons),
			listTagsByCategory('comment').then(setCommentTags),
			getDeckGameCounts().then(setGameCounts),
		]).catch((e) => console.error('Failed to load new game data:', e));
	}, []);

	const goBack = () => {
		setError(null);
		if (step > 0) setStep(step - 1);
		else router.back();
	};

	// Android back steps back through the flow before leaving it.
	useEffect(() => {
		const sub = BackHandler.addEventListener('hardwareBackPress', () => {
			if (step === 0) return false;
			goBack();
			return true;
		});
		return () => sub.remove();
	}, [step]);

	const advance = (problem: string | null) => {
		setError(problem);
		if (!problem) setStep(step + 1);
	};

	const checkSeats = () => {
		if (seats.some((seat) => seat.deckId === null)) return 'Every seat needs a deck.';
		return null;
	};

	const checkTurns = () => {
		if (!seats.some((seat) => seat.won)) return 'Someone must have won.';
		if (seats.some((seat) => seat.outTurn === null || !seat.reason))
			return 'Mark how everyone went out.';
		return null;
	};

	const handleCreateDeck = (name: string, commander: string) => addDeck(name, commander);

	const handleSave = async () => {
		const tagId = (label: string) => gameEndReasons.find((reason) => reason.label === label)!.id;
		const winner = seats.find((seat) => seat.won)!;

		const seatInputs: SeatInput[] = seats.map((seat, i) => ({
			deckId: seat.deckId!,
			turnOrder: i + 1,
			placement: placementOf(seat, seats),
			eliminatedTurn: seat.won ? null : seat.outTurn,
			winConditionId: seat.won ? tagId(seat.reason) : null,
			eliminationReasonId: seat.won ? null : tagId(seat.reason),
			commentTagIds: seat.isUsers ? commentTagIds : [],
		}));

		setError(null);
		setSaving(true);
		try {
			await logGame({ totalTurns: winner.outTurn!, seats: seatInputs });
			router.back();
		} catch (e) {
			console.error('Failed to save game:', e);
			setError('Something went wrong saving the game. Try again.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<View style={styles.screen}>
			<PageHead label={STEPS[step].label} right={`${step + 1} of ${STEPS.length}`} onBack={goBack} />
			{step === 0 && (
				<SeatsStep
					seats={seats}
					setSeats={setSeats}
					decks={decks}
					gameCounts={gameCounts}
					onCreateDeck={handleCreateDeck}
					onNext={() => advance(checkSeats())}
					error={error}
				/>
			)}
			{step === 1 && (
				<TurnsStep
					seats={seats}
					setSeats={setSeats}
					turn={turn}
					setTurn={setTurn}
					reasons={gameEndReasons.map((reason) => reason.label)}
					onNext={() => advance(checkTurns())}
					error={error}
				/>
			)}
			{step === 2 && (
				<AfterStep
					seats={seats}
					commentTags={commentTags}
					selectedTagIds={commentTagIds}
					setSelectedTagIds={setCommentTagIds}
					onSave={handleSave}
					saving={saving}
					error={error}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: ink.paper },
});
