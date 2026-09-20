import { StyleSheet, View } from 'react-native';
import { TagCount } from '@/lib/db';
import { fonts, ink, onRules, RULE_SPACING } from '@/lib/notebook';
import { shortReason } from '@/lib/reasons';
import { Txt } from '@/components/notebook/Hand';
import { SectionTitle } from '@/components/notebook/SectionTitle';

// Side-by-side "how I win" / "how I lose" tallies of game-end reasons, split by a faint rule.
export function ReasonColumns({
	winTitle,
	wins,
	loseTitle,
	losses,
}: {
	winTitle: string;
	wins: TagCount[];
	loseTitle: string;
	losses: TagCount[];
}) {
	return (
		<View style={styles.columns}>
			<ReasonColumn title={winTitle} reasons={wins} color={ink.ink} />
			<View style={styles.divider} />
			<ReasonColumn title={loseTitle} reasons={losses} color={ink.red} />
		</View>
	);
}

function ReasonColumn({ title, reasons, color }: { title: string; reasons: TagCount[]; color: string }) {
	return (
		<View style={styles.column}>
			<SectionTitle color={color} size={22}>
				{title}
			</SectionTitle>
			{reasons.length === 0 ?
				<Txt style={styles.label}>nothing yet</Txt>
			:	reasons.map((reason) => (
					<View key={reason.tag_id} style={styles.row}>
						<Txt style={styles.label} numberOfLines={1}>
							{shortReason(reason.label)}
						</Txt>
						<Txt style={[styles.count, { color }]}>{reason.count}</Txt>
					</View>
				))
			}
		</View>
	);
}

const styles = StyleSheet.create({
	columns: { flexDirection: 'row' },
	column: { flex: 1 },
	divider: { width: 1.5, marginHorizontal: 14, backgroundColor: ink.rule },
	row: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	label: { flex: 1, ...onRules(fonts.kalam300, 14), color: ink.body },
	count: { width: 32, textAlign: 'right', ...onRules(fonts.caveat600, 20) },
});
