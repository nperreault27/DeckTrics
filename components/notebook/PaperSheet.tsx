import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RuledPaper } from '@/components/notebook/RuledPaper';
import { SectionTitle } from '@/components/notebook/SectionTitle';
import { ink, RULE_SPACING, screenPadding } from '@/lib/notebook';

// A sheet of ruled notebook paper that slides up over the screen; tap outside to close.
export function PaperSheet({
	visible,
	title,
	onClose,
	children,
}: {
	visible: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
}) {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
			<KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<Pressable style={styles.backdrop} onPress={onClose} />
				<View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
					<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps='handled'>
						<RuledPaper margin />
						<SectionTitle size={24}>{title}</SectionTitle>
						{children}
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
});
