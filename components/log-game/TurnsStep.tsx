import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
	fonts,
	handDrawnRadiusSmall,
	ink,
	onRules,
	RULE_SPACING,
	screenPadding,
	wrapOnRules,
} from '@/lib/notebook';
import { Txt } from '@/components/notebook/Hand';
import { PenButton } from '@/components/notebook/PenButton';
import { ChevronDown, Minus, Plus } from '@/components/notebook/PenIcons';
import { PickerSheet } from '@/components/notebook/PickerSheet';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { Seat } from './model';

type Picking = { key: number; kind: 'won' | 'lost' };

type Props = {
	seats: Seat[];
	setSeats: (seats: Seat[]) => void;
	turn: number;
	setTurn: (turn: number) => void;
	reasons: string[];
	onNext: () => void;
	error: string | null;
};

export function TurnsStep({ seats, setSeats, turn, setTurn, reasons, onNext, error }: Props) {
	const [picking, setPicking] = useState<Picking | null>(null);
	const pickingSeat = seats.find((seat) => seat.key === picking?.key);

	const clearSeat = (key: number) =>
		setSeats(
			seats.map((seat) => (seat.key === key ? { ...seat, won: false, outTurn: null, reason: '' } : seat)),
		);

	// Winning ends the game: everyone still in goes out this turn to the same thing.
	const markWon = (key: number, reason: string) =>
		setSeats(
			seats.map((seat) => {
				if (seat.key === key) return { ...seat, won: true, outTurn: turn, reason };
				if (seat.outTurn === null) return { ...seat, won: false, outTurn: turn, reason };
				return { ...seat, won: false };
			}),
		);

	const markLost = (key: number, reason: string) =>
		setSeats(
			seats.map((seat) => (seat.key === key ? { ...seat, won: false, outTurn: turn, reason } : seat)),
		);

	const handlePick = (reason: string) => {
		if (!picking) return;
		if (picking.kind === 'won') markWon(picking.key, reason);
		else markLost(picking.key, reason);
		setPicking(null);
	};

	const pickedValue =
		!pickingSeat ? ''
		: picking?.kind === 'won' ? (pickingSeat.won ? pickingSeat.reason : '')
		: !pickingSeat.won && pickingSeat.outTurn !== null ? pickingSeat.reason
		: '';

	return (
		<>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
				<RuledPaper margin />

				<View style={styles.turnRow}>
					<Pressable
						style={[styles.stepBox, { borderColor: turn > 1 ? ink.ink : ink.rule }]}
						onPress={() => setTurn(turn - 1)}
						disabled={turn <= 1}
						accessibilityLabel='Previous turn'>
						<Minus color={turn > 1 ? ink.ink : ink.faint} />
					</Pressable>
					<View style={styles.turnCenter}>
						<Txt style={styles.turnWord}>turn</Txt>
						<Txt style={styles.turnNumber}>{turn}</Txt>
					</View>
					<Pressable
						style={[styles.stepBox, { borderColor: ink.blue }]}
						onPress={() => setTurn(turn + 1)}
						accessibilityLabel='Next turn'>
						<Plus />
					</Pressable>
					<Rule color={ink.ink} />
				</View>

				<Txt style={styles.body}>Mark anyone who's out this turn, and how. Leave the rest blank.</Txt>
				<View style={styles.gap} />

				{seats.map((seat, index) => {
					const outEarlier = seat.outTurn !== null && seat.outTurn < turn;
					const lost = !seat.won && seat.outTurn !== null;
					const status =
						seat.won ? { text: `won, turn ${seat.outTurn}`, color: ink.blue }
						: lost ? { text: `out, turn ${seat.outTurn}`, color: ink.red }
						: { text: 'still in', color: ink.faint };

					return (
						<View key={seat.key} style={styles.seatBlock}>
							<View style={styles.line}>
								<Txt style={styles.deckName} numberOfLines={1}>
									{seat.deckName}
								</Txt>
								<Txt style={[styles.status, { color: status.color }]}>
									seat {index + 1} · {status.text}
								</Txt>
							</View>
							<View style={[styles.line, styles.selects]}>
								<ReasonSelect
									placeholder='won by...'
									value={seat.won ? seat.reason : ''}
									color={ink.blue}
									disabled={outEarlier && !seat.won}
									onPress={() => setPicking({ key: seat.key, kind: 'won' })}
								/>
								<ReasonSelect
									placeholder='lost to...'
									value={lost ? seat.reason : ''}
									color={ink.red}
									disabled={outEarlier}
									onPress={() => setPicking({ key: seat.key, kind: 'lost' })}
								/>
							</View>
							{index < seats.length - 1 && <Rule width={1.5} />}
						</View>
					);
				})}

				<View style={styles.gap} />
				{error && <Txt style={styles.error}>{error}</Txt>}
				<PenButton label='end the game' onPress={onNext} />
			</ScrollView>

			<PickerSheet
				visible={picking !== null}
				title={
					picking?.kind === 'won' ?
						`How did ${pickingSeat?.deckName ?? ''} win?`
					:	`What took ${pickingSeat?.deckName ?? ''} out?`
				}
				options={reasons.map((reason) => ({ key: reason, label: reason.toLowerCase() }))}
				onPick={handlePick}
				onClose={() => setPicking(null)}
				onClear={
					pickedValue && picking ?
						() => {
							clearSeat(picking.key);
							setPicking(null);
						}
					:	undefined
				}
			/>
		</>
	);
}

// An underlined dropdown line: the chosen reason in its pen colour, or a faint placeholder.
function ReasonSelect({
	placeholder,
	value,
	color,
	disabled,
	onPress,
}: {
	placeholder: string;
	value: string;
	color: string;
	disabled: boolean;
	onPress: () => void;
}) {
	const ruleColor =
		disabled ? ink.rule
		: value ? color
		: ink.faint;

	return (
		<Pressable style={styles.select} onPress={onPress} disabled={disabled}>
			<Txt style={[styles.selectText, { color: value ? color : disabled ? ink.rule : ink.faint }]} numberOfLines={1}>
				{value ? value.toLowerCase() : placeholder}
			</Txt>
			{!disabled && (
				<View style={styles.chevron}>
					<ChevronDown color={value ? color : ink.faint} />
				</View>
			)}
			<Rule color={ruleColor} width={1.5} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	scroll: { flex: 1, backgroundColor: ink.paper },
	content: { flexGrow: 1, ...screenPadding, paddingBottom: RULE_SPACING * 2 },
	gap: { height: RULE_SPACING },
	body: { ...wrapOnRules(fonts.kalam300, 14), color: ink.body },
	error: { ...wrapOnRules(fonts.caveat500, 20), color: ink.red },

	// Two ruled lines: the steppers are drawn boxes, the count is written on the second rule.
	turnRow: { flexDirection: 'row', height: RULE_SPACING * 2, marginBottom: RULE_SPACING },
	stepBox: {
		...handDrawnRadiusSmall,
		width: 46,
		height: 46,
		marginTop: 10,
		borderWidth: 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	turnCenter: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'flex-start',
		marginTop: RULE_SPACING,
		gap: 4,
	},
	turnWord: { ...onRules(fonts.caveat500, 22), color: ink.ink },
	turnNumber: { ...onRules(fonts.caveat700, 44, 1), color: ink.blue },

	seatBlock: { height: RULE_SPACING * 3 },
	line: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	selects: { gap: 20 },
	deckName: { flex: 1, ...onRules(fonts.caveat600, 22), color: ink.ink },
	status: onRules(fonts.kalam300, 12),
	select: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	selectText: { flex: 1, ...onRules(fonts.caveat500, 19) },
	chevron: { marginTop: 13 },
});
