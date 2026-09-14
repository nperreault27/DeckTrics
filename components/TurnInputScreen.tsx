import { Tag } from '@/lib/db';
import { SeatFormValue } from './SeatForm';
import { Button, Card, HelperText, Text } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { CustomDropdown } from './CustomDropdown';
import { ScrollView } from 'react-native-gesture-handler';

type Props = {
	seats: SeatFormValue[];
	gameEndReasons: Tag[];
	updateSeats: (value: SeatFormValue) => void;
	setTotalTurns: (turn: string) => void;
	handleStageMidGame: () => void;
	error: string | null;
};

export const TurnInputScreen = (props: Props) => {
	const { seats, gameEndReasons, updateSeats, handleStageMidGame, error, setTotalTurns } = props;
	const [turn, setTurn] = useState(1);

	const selectWinner = (value: string | undefined, seat: SeatFormValue) => {
		if (!value) {
			updateSeats({ ...seat, is_winner: false, endGameTurn: '', winCondition: '' });
			setTotalTurns('');
			return;
		}
		seats.forEach((s) => {
			if (seat === s) {
				updateSeats({ ...s, is_winner: true, endGameTurn: String(turn), winCondition: value });
			} else if (s.endGameTurn === '') {
				updateSeats({ ...s, endGameTurn: String(turn), eliminationReason: value });
			}
		});
		setTotalTurns(String(turn));
	};
	console.log(seats);
	return (
		<ScrollView bounces={false} keyboardShouldPersistTaps='handled'>
			<View style={styles.flexGrid}>
				<Card style={styles.fullWidth}>
					<Card.Content>
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<Button
								mode='outlined'
								onPress={() => {
									setTurn(turn - 1);
								}}
								disabled={turn <= 1}
								labelStyle={styles.buttonText}
								style={{ borderRadius: 4 }}>
								-
							</Button>
							<Text style={{ fontSize: 20, fontWeight: 'bold' }}>Turn {turn}</Text>
							<Button
								mode='contained'
								onPress={() => {
									setTurn(turn + 1);
								}}
								labelStyle={styles.buttonText}>
								+
							</Button>
						</View>
					</Card.Content>
				</Card>
				{seats.map((seat) => {
					return (
						<Card style={styles.fullWidth} key={seat.index}>
							<Card.Content style={styles.content}>
								<Text>{seat.deckName}</Text>
								<CustomDropdown
									options={gameEndReasons.map((tag) => {
										return { label: tag.label, value: tag.label };
									})}
									placeholder='Enter the reason this deck won!'
									value={seat.winCondition}
									disabled={parseInt(seat.endGameTurn) < turn && !seat.is_winner}
									menuContentStyle={styles.menuContent}
									onSelect={(value) => {
										selectWinner(value, seat);
									}}
								/>
								<CustomDropdown
									options={gameEndReasons.map((tag) => {
										return { label: tag.label, value: tag.label };
									})}
									placeholder='Enter the reason this deck lost.'
									value={seat.eliminationReason}
									disabled={parseInt(seat.endGameTurn) < turn}
									menuContentStyle={styles.menuContent}
									onSelect={(value) => {
										console.log(value);
										if (value) {
											updateSeats({ ...seat, endGameTurn: String(turn), eliminationReason: value });
										} else {
											console.log(value);
											updateSeats({ ...seat, endGameTurn: '', eliminationReason: '' });
										}
									}}
								/>
							</Card.Content>
						</Card>
					);
				})}
				{error && <HelperText type='error'>{error}</HelperText>}
				<Button
					mode='contained'
					onPress={handleStageMidGame}
					style={{ borderRadius: 8, width: '100%', marginBottom: 8 }}>
					End Game
				</Button>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	flexGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap', // Forces items to wrap down onto a new line
		justifyContent: 'space-between',
		padding: 8,
	},
	fullWidth: { width: '100%', marginBottom: 8 },
	buttonText: { fontSize: 26, fontWeight: 'bold' },
	menuContent: { paddingVertical: 0, paddingHorizontal: 0 },
	content: { gap: 8 },
});
