import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text, useTheme } from 'react-native-paper';

export type RankedBarItem = {
	id: string | number;
	label: string;
	value: number; // raw value used for bar width scaling (e.g. win count, or %)
	valueLabel: string; // display text, e.g. "52%"
	countLabel?: string; // secondary display text, e.g. "28"
};

type Props = { items: RankedBarItem[]; barHeight?: number; maxValue?: number };

export function RankedBarList({ items, barHeight = 8, maxValue: customMaxValue }: Props) {
	const theme = useTheme();
	const maxValue = customMaxValue ?? Math.max(...items.map((i) => i.value), 1);

	return (
		<View style={styles.container}>
			{items.map((item) => {
				const widthPct = Math.max((item.value / maxValue) * 100, 3);

				return (
					<View key={item.id} style={styles.row}>
						<View style={styles.labelRow}>
							<Text style={[styles.label]} numberOfLines={1}>
								{item.label}
							</Text>
							<View style={styles.metaRow}>
								<Text style={[styles.valueLabel, { color: theme.colors.tertiary }]}>
									{item.valueLabel}
								</Text>
								{item.countLabel && (
									<Text style={[styles.countLabel, { color: theme.colors.tertiary }]}>
										{' '}
										· {item.countLabel}
									</Text>
								)}
							</View>
						</View>

						<Svg width='100%' height={barHeight}>
							<Rect
								x='0'
								y='0'
								width='100%'
								height={barHeight}
								rx={barHeight / 2}
								fill={theme.colors.tertiary}
							/>
							<Rect
								x='0'
								y='0'
								width={`${widthPct}%`}
								height={barHeight}
								rx={barHeight / 2}
								fill={theme.colors.primary}
							/>
						</Svg>
					</View>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { gap: 16 },
	row: { gap: 6 },
	labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	label: { fontSize: 14, fontWeight: '600', flexShrink: 1, marginRight: 8 },
	metaRow: { flexDirection: 'row' },
	valueLabel: { fontSize: 13, fontWeight: '600' },
	countLabel: { fontSize: 13 },
});
