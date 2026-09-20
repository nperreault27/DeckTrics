import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fetchSuggestions } from '@/api/scryfall';
import { fonts, ink, labelText, RULE_SPACING, wrapOnRules } from '@/lib/notebook';
import { Txt } from '@/components/notebook/Hand';
import { LineInput } from '@/components/notebook/LineInput';
import { PaperSheet } from '@/components/notebook/PaperSheet';
import { PenButton } from '@/components/notebook/PenButton';
import { PickerOptions } from '@/components/notebook/PickerSheet';

const MAX_SUGGESTIONS = 6;

// Paper sheet for adding one of your own decks: a name, and a commander searched on Scryfall
// (anything typed is accepted too).
export function NewDeckSheet({
	visible,
	onClose,
	onSave,
}: {
	visible: boolean;
	onClose: () => void;
	onSave: (name: string, commander: string) => Promise<void>;
}) {
	const [name, setName] = useState('');
	const [commander, setCommander] = useState('');
	const [picked, setPicked] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Debounced commander search; stops once a suggestion has been picked.
	useEffect(() => {
		const trimmed = commander.trim();
		if (picked || trimmed.length < 2) {
			setSuggestions([]);
			return;
		}
		let stale = false;
		const timer = setTimeout(() => {
			fetchSuggestions(trimmed).then((names) => !stale && setSuggestions(names.slice(0, MAX_SUGGESTIONS)));
		}, 300);
		return () => {
			stale = true;
			clearTimeout(timer);
		};
	}, [commander, picked]);

	const close = () => {
		setName('');
		setCommander('');
		setPicked(false);
		setError(null);
		onClose();
	};

	const save = async () => {
		setError(null);
		setSaving(true);
		try {
			await onSave(name.trim(), commander.trim());
			close();
		} catch {
			// Deck names are unique.
			setError('You already have a deck by that name.');
		} finally {
			setSaving(false);
		}
	};

	const ready = name.trim() !== '' && commander.trim() !== '' && !saving;

	return (
		<PaperSheet visible={visible} title='A new deck' onClose={close}>
			<Txt style={labelText}>Name</Txt>
			<LineInput value={name} onChangeText={setName} placeholder='what do you call it?' autoFocus />

			<Txt style={labelText}>Commander</Txt>
			<LineInput
				value={commander}
				onChangeText={(text) => {
					setCommander(text);
					setPicked(false);
				}}
				placeholder='search a commander...'
			/>
			<PickerOptions
				options={suggestions.map((s) => ({ key: s, label: s }))}
				onPick={(s) => {
					setCommander(s);
					setPicked(true);
				}}
			/>

			<View style={styles.gap} />
			{error && <Txt style={styles.error}>{error}</Txt>}
			<PenButton label={saving ? 'writing it down...' : 'write it down'} onPress={save} disabled={!ready} />
		</PaperSheet>
	);
}

const styles = StyleSheet.create({
	gap: { height: RULE_SPACING },
	error: { ...wrapOnRules(fonts.caveat500, 20), color: ink.red },
});
