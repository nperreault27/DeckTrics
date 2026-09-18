import { useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useGamesStore } from '@/store/useGamesStore';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const getPlacementText = (placement: number) => {
	switch (placement) {
		case 1:
			return '1ST';
		case 2:
			return '2ND';
		case 3:
			return '3RD';
		case 4:
			return `4TH`;
		default:
			return `${placement}TH`;
	}
};

export default function HomeScreen() {
	const { games, loading, loadGames } = useGamesStore();
	const theme = useTheme();

	useEffect(() => {
		loadGames();
	}, []);

	const totalWins = games.filter((game) => game.placement === 1).length;
	const totalGames = games.length;
	const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={[theme.colors.primary, theme.colors.secondary]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}>
				<View style={styles.headerCard}>
					<Text style={{ fontSize: 28, fontWeight: '700', color: theme.colors.onPrimary }}>
						Enter a game
					</Text>
					<Button
						onPress={() => router.push('/new-game')}
						style={{ ...styles.logButton, backgroundColor: theme.colors.background }}>
						<View style={styles.navRow}>
							<Text style={{ fontSize: 16, fontWeight: 'bold' }}>New Game</Text>
							<SendIcon size={16} color={theme.colors.secondary} />
						</View>
					</Button>
				</View>
			</LinearGradient>
			<View style={styles.metricsRow}>
				<Card style={styles.metricCard}>
					<Card.Content
						style={{
							gap: 8,
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outline,
							borderWidth: 1,
						}}>
						<Text style={{ fontSize: 12, color: theme.colors.tertiary }}>WIN RATE</Text>
						<Text style={{ color: theme.colors.primary, fontSize: 32, fontWeight: 'bold' }}>
							{winRate.toFixed(1)}%
						</Text>
					</Card.Content>
				</Card>

				<Card style={styles.metricCard}>
					<Card.Content
						style={{
							gap: 8,
							backgroundColor: theme.colors.surface,
							borderColor: theme.colors.outline,
							borderWidth: 1,
						}}>
						<Text style={{ fontSize: 12, color: theme.colors.tertiary }}>GAMES</Text>
						<Text style={{ fontSize: 32, fontWeight: 'bold' }}>{totalGames}</Text>
					</Card.Content>
				</Card>
			</View>
			<View style={{ gap: 8 }}>
				<Text style={{ fontSize: 12, color: theme.colors.tertiary }}>PREVIOUS GAMES</Text>
				<FlatList
					data={games}
					keyExtractor={(item) => item.id.toString()}
					refreshing={loading}
					onRefresh={loadGames}
					contentContainerStyle={styles.list}
					ListEmptyComponent={<Text style={styles.empty}>No games logged yet.</Text>}
					renderItem={({ item }) => {
						const accentColor = item.placement === 1 ? theme.colors.primary : theme.colors.tertiary;

						return (
							<View style={{ ...styles.rowCard, backgroundColor: theme.colors.surface }}>
								<View style={{ ...styles.statusBar, backgroundColor: accentColor }} />
								<View style={styles.rowContent}>
									<Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.deck_name}</Text>
									<Text style={{ ...styles.meta, color: theme.colors.tertiary }}>
										{item.total_turns} turns · {new Date(item.played_at).toLocaleDateString()}
									</Text>
								</View>
								<Text style={{ ...styles.placement, color: accentColor }}>
									{getPlacementText(item.placement)}
								</Text>
							</View>
						);
					}}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingTop: 16, paddingHorizontal: 16, gap: 24 },
	navRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingHorizontal: 8,
		height: 40,
		borderRadius: 0,
	},
	headerCard: { height: 180, justifyContent: 'center', padding: 16, gap: 16 },
	logButton: { marginBottom: 16, borderRadius: 4, alignContent: 'space-between' },
	list: { paddingBottom: 24, gap: 8 },
	meta: { fontSize: 12, marginTop: 2 },
	empty: { textAlign: 'center', marginTop: 40 },
	metricsRow: { flexDirection: 'row', gap: 16 },
	metricCard: { flex: 1, justifyContent: 'space-between', borderRadius: 0 },
	rowCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 0, overflow: 'hidden' },
	statusBar: { width: 4, marginLeft: 16, marginVertical: 14, height: '60%' },
	rowContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, justifyContent: 'center' },
	placement: { fontSize: 16, fontWeight: '800', marginRight: 16, minWidth: 32, textAlign: 'right' },
});

function SendIcon({ size = 32, color }: { size?: number; color: string }) {
	return (
		<Svg width={size} height={size} viewBox='0 0 24 24' fill='none'>
			<Path
				d='M16.3153 16.6681C15.9247 17.0587 15.9247 17.6918 16.3153 18.0824C16.7058 18.4729 17.339 18.4729 17.7295 18.0824L22.3951 13.4168C23.1761 12.6357 23.1761 11.3694 22.3951 10.5883L17.7266 5.9199C17.3361 5.52938 16.703 5.52938 16.3124 5.91991C15.9219 6.31043 15.9219 6.9436 16.3124 7.33412L19.9785 11.0002L2 11.0002C1.44772 11.0002 1 11.4479 1 12.0002C1 12.5524 1.44772 13.0002 2 13.0002L19.9832 13.0002L16.3153 16.6681Z'
				fill={color}
			/>
		</Svg>
	);
}
