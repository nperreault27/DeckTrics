import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Tag } from '@/lib/db';
import {
	fonts,
	handDrawnRadiusSmall,
	ink,
	onRules,
	RULE_SPACING,
	screenPadding,
	wrapOnRules,
} from '@/lib/notebook';
import { shortReason } from '@/lib/reasons';
import { Txt } from '@/components/notebook/Hand';
import { PenButton } from '@/components/notebook/PenButton';
import { RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { displayDeckName, ordinal, placementOf, Seat } from './model';

type Props = {
	seats: Seat[];
	commentTags: Tag[];
	selectedTagIds: number[];
	setSelectedTagIds: (ids: number[]) => void;
	onSave: () => void;
	saving: boolean;
	error: string | null;
};

export function AfterStep({ seats, commentTags, selectedTagIds, setSelectedTagIds, onSave, saving, error }: Props) {
	const winner = seats.find((seat) => seat.won);
	const selected = new Set(selectedTagIds);
	const ranked = seats
		.map((seat) => ({ seat, placement: placementOf(seat, seats) }))
		.sort((a, b) => a.placement - b.placement);

	const toggle = (id: number) =>
		setSelectedTagIds(selected.has(id) ? selectedTagIds.filter((t) => t !== id) : [...selectedTagIds, id]);

	return (
		<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
			<RuledPaper margin />
			<Txt style={styles.title}>How'd it go?</Txt>
			<Txt style={styles.body}>
				{winner ?
					`${displayDeckName(winner.deckName)} took it on turn ${winner.outTurn} by ${winner.reason.toLowerCase()}. `
				:	''}
				Circle whatever applied to your game.
			</Txt>
			<View style={styles.gap} />

			<View style={styles.chips}>
				{commentTags.map((tag) => {
					const on = selected.has(tag.id);
					return (
						<Pressable key={tag.id} style={styles.chip} onPress={() => toggle(tag.id)}>
							{on && <View style={styles.circle} />}
							<Txt style={[styles.chipText, { color: on ? ink.blue : ink.faint }]}>
								{tag.label.toLowerCase()}
							</Txt>
						</Pressable>
					);
				})}
			</View>

			<View style={styles.gap} />
			<SectionTitle>The game as written</SectionTitle>
			{ranked.map(({ seat, placement }) => (
				<View key={seat.key} style={styles.resultRow}>
					<Txt style={[styles.placement, { color: placement === 1 ? ink.blue : ink.ink }]}>
						{ordinal(placement)}
					</Txt>
					<Txt style={[styles.resultName, seat.isUsers && { color: ink.blue }]} numberOfLines={1}>
						{displayDeckName(seat.deckName)}
					</Txt>
					<Txt style={styles.resultMeta}>
						{shortReason(seat.reason)}, t{seat.outTurn}
					</Txt>
				</View>
			))}

			<View style={styles.gap} />
			{error && <Txt style={styles.error}>{error}</Txt>}
			<PenButton label={saving ? 'writing it down...' : 'write it in the notebook'} onPress={onSave} disabled={saving} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: ink.paper },
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	gap: { height: RULE_SPACING },
	title: { ...onRules(fonts.caveat700, 34, 2), color: ink.blue },
	body: { ...wrapOnRules(fonts.kalam300, 14), color: ink.body },
	error: { ...wrapOnRules(fonts.caveat500, 20), color: ink.red },

	// One chip row per ruled line; a circled chip gets a pen loop drawn around its word.
	chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6 },
	chip: { height: RULE_SPACING, paddingHorizontal: 10 },
	circle: {
		...handDrawnRadiusSmall,
		position: 'absolute',
		left: 0,
		right: 0,
		top: 3,
		bottom: -1,
		borderWidth: 2,
		borderColor: ink.blue,
	},
	chipText: onRules(fonts.caveat500, 19),

	resultRow: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	placement: { width: 44, ...onRules(fonts.caveat700, 20) },
	resultName: { flex: 1, ...onRules(fonts.caveat600, 20), color: ink.ink },
	resultMeta: { ...onRules(fonts.kalam300, 12), color: ink.faint },
});
