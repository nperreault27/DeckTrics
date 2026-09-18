import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Txt } from '@/components/notebook/Hand';
import { Rule, RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { fonts, ink, onRules, RULE_SPACING, screenPadding } from '@/lib/notebook';

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

// A sheet of notebook paper that slides up with one option per ruled line.
export function PickerSheet({ visible, title, options, onPick, onClose, onClear, search, emptyText }: Props) {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
			<KeyboardAvoidingView
				style={styles.fill}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={styles.backdrop} onPress={onClose} />
				<View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
					<ScrollView
						contentContainerStyle={styles.content}
						keyboardShouldPersistTaps='handled'>
						<RuledPaper margin />
						<SectionTitle size={24}>{title}</SectionTitle>

						{search && (
							<View style={styles.searchRow}>
								<TextInput
									style={styles.search}
									value={search.value}
									onChangeText={search.onChange}
									placeholder={search.placeholder}
									placeholderTextColor={ink.faint}
									autoFocus
									autoCorrect={false}
									cursorColor={ink.blue}
									selectionColor={ink.rule}
								/>
								<Rule color={ink.blue} width={1.5} />
							</View>
						)}

						{options.map((option) => (
							<Pressable key={option.key} style={styles.option} onPress={() => onPick(option.key)}>
								<Txt style={[styles.optionLabel, { color: option.color ?? ink.ink }]} numberOfLines={1}>
									{option.label}
								</Txt>
								{option.meta && <Txt style={styles.optionMeta}>{option.meta}</Txt>}
							</Pressable>
						))}
						{options.length === 0 && emptyText && <Txt style={styles.empty}>{emptyText}</Txt>}

						{onClear && (
							<Pressable style={styles.option} onPress={onClear}>
								<Txt style={[styles.optionLabel, { color: ink.red }]}>clear it</Txt>
							</Pressable>
						)}
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1 },
	backdrop: { flex: 1, backgroundColor: 'rgba(34, 48, 74, 0.25)' },
	sheet: { maxHeight: '75%', backgroundColor: ink.paper, borderTopWidth: 2, borderTopColor: ink.margin },
	content: { ...screenPadding, paddingBottom: RULE_SPACING },
	searchRow: { height: RULE_SPACING },
	// TextInput can't take the ruled-line baseline trick, so it is sized to the band and padded down.
	search: {
		height: RULE_SPACING,
		paddingVertical: 0,
		paddingTop: 4,
		fontFamily: fonts.caveat500,
		fontSize: 22,
		color: ink.ink,
		includeFontPadding: false,
	},
	option: { flexDirection: 'row', alignItems: 'flex-start', height: RULE_SPACING },
	optionLabel: { flex: 1, ...onRules(fonts.caveat500, 22) },
	optionMeta: { ...onRules(fonts.kalam300, 12), color: ink.faint },
	empty: { ...onRules(fonts.kalam300, 14), color: ink.faint },
});
