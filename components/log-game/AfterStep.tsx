import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Tag } from '@/lib/db';
import {
	fonts,
	ink,
	onRules,
	overhang,
	RULE_SPACING,
	screenPadding,
	wrapOnRules,
} from '@/lib/notebook';
import { shortReason } from '@/lib/reasons';
import { Txt } from '@/components/notebook/Hand';
import { PenButton } from '@/components/notebook/PenButton';
import { PenLoop } from '@/components/notebook/PenLoop';
import { RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { ordinal, placementOf, Seat } from './model';

type Props = {
	seats: Seat[];
	commentTags: Tag[];
	selectedTagIds: number[];
	setSelectedTagIds: (ids: number[]) => void;
	onSave: () => void;
	saving: boolean;
	error: string | null;
};

const CHIP_SIZE = 19;

export function AfterStep({ seats, commentTags, selectedTagIds, setSelectedTagIds, onSave, saving, error }: Props) {
	// Chip widths, measured so a circled one can be ringed to fit its own word.
	const [chipWidths, setChipWidths] = useState<Record<number, number>>({});
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
					`${winner.deckName} took it on turn ${winner.outTurn} by ${winner.reason.toLowerCase()}. `
				:	''}
				Circle whatever applied to your game.
			</Txt>
			<View style={styles.gap} />

			<View style={styles.chips}>
				{commentTags.map((tag) => {
					const on = selected.has(tag.id);
					return (
						<Pressable key={tag.id} style={styles.chip} onPress={() => toggle(tag.id)}>
							<View
								style={styles.chipWord}
								onLayout={(event) => {
									// Read the width here, not inside the updater: the event is
									// recycled as soon as this handler returns, and the updater
									// runs later, by which point nativeEvent is null.
									const measured = event.nativeEvent.layout.width;
									setChipWidths((w) =>
										w[tag.id] === measured ? w : { ...w, [tag.id]: measured },
									);
								}}>
								{on && (
									<PenLoop
										width={(chipWidths[tag.id] ?? 0) - overhang(CHIP_SIZE)}
										fontFamily={fonts.caveat500}
										fontSize={CHIP_SIZE}
										color={ink.red}
										gap={2}
									/>
								)}
								<Txt style={[styles.chipText, { color: on ? ink.red : ink.faint }]}>
									{tag.label.toLowerCase()}
								</Txt>
							</View>
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
						{seat.deckName}
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

	// Two ruled lines per chip row: a circled chip has a pen loop drawn round its word, and the
	// loop is a good deal taller than the writing. The side padding gives it room to overhang
	// without reaching into the chip alongside.
	chips: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4 },
	chip: { height: RULE_SPACING * 2, paddingHorizontal: 20 },
	chipWord: { alignSelf: 'flex-start' },
	chipText: onRules(fonts.caveat500, CHIP_SIZE),

	resultRow: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	placement: { width: 44, ...onRules(fonts.caveat700, 20) },
	resultName: { flex: 1, ...onRules(fonts.caveat600, 20), color: ink.ink },
	resultMeta: { ...onRules(fonts.kalam300, 12), color: ink.faint },
});
