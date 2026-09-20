import { Pressable, StyleSheet } from 'react-native';
import { Txt } from '@/components/notebook/Hand';
import { LineInput } from '@/components/notebook/LineInput';
import { PaperSheet } from '@/components/notebook/PaperSheet';
import { fonts, ink, onRules, RULE_SPACING } from '@/lib/notebook';

export type PickerOption = { key: string; label: string; meta?: string; color?: string };

type Props = {
	visible: boolean;
	title: string;
	options: PickerOption[];
	onPick: (key: string) => void;
	onClose: () => void;
	// Shown as a red "clear it" line when set.
	onClear?: () => void;
	search?: { value: string; onChange: (text: string) => void; placeholder: string };
	emptyText?: string;
};

// A paper sheet listing one option per ruled line, with an optional search line on top.
export function PickerSheet({ visible, title, options, onPick, onClose, onClear, search, emptyText }: Props) {
	return (
		<PaperSheet visible={visible} title={title} onClose={onClose}>
			{search && (
				<LineInput
					value={search.value}
					onChangeText={search.onChange}
					placeholder={search.placeholder}
					autoFocus
				/>
			)}

			<PickerOptions options={options} onPick={onPick} />
			{options.length === 0 && emptyText && <Txt style={styles.empty}>{emptyText}</Txt>}

			{onClear && (
				<Pressable style={styles.option} onPress={onClear}>
					<Txt style={[styles.label, { color: ink.red }]}>clear it</Txt>
				</Pressable>
			)}
		</PaperSheet>
	);
}

// The option lines on their own, for sheets that lay out their own inputs.
export function PickerOptions({ options, onPick }: { options: PickerOption[]; onPick: (key: string) => void }) {
	return options.map((option) => (
		<Pressable key={option.key} style={styles.option} onPress={() => onPick(option.key)}>
			<Txt style={[styles.label, { color: option.color ?? ink.ink }]} numberOfLines={1}>
				{option.label}
			</Txt>
			{option.meta && <Txt style={styles.meta}>{option.meta}</Txt>}
		</Pressable>
	));
}

const styles = StyleSheet.create({
	option: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	label: { flex: 1, ...onRules(fonts.caveat500, 22) },
	meta: { ...onRules(fonts.kalam300, 12), color: ink.faint },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },
});
