import { StyleSheet, View } from 'react-native';
import { fonts, ink, labelText, onRules, overhang } from '@/lib/notebook';
import { Txt } from '@/components/notebook/Hand';

// Label-above-number pairs in a row, two ruled lines tall.
export function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
	return (
		<View style={styles.row}>
			{stats.map((stat) => (
				<View key={stat.label}>
					<Txt style={labelText}>{stat.label}</Txt>
					<Txt style={styles.value}>{stat.value}</Txt>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', gap: 22 - overhang(30) },
	value: { ...onRules(fonts.caveat700, 30), color: ink.ink },
});
