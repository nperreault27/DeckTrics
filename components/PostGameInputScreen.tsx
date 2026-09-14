import { Tag } from '@/lib/db';
import { SeatFormValue } from './SeatForm';
import { Button, HelperText } from 'react-native-paper';
import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

type Props = {
	updateSeat: (value: SeatFormValue) => void;
	seats: SeatFormValue[];
	commentTags: Tag[];
	handlePostGame: () => void;
	error: string | null;
	submitting?: boolean;
};

export const PostGameInputScreen = (props: Props) => {
	const { commentTags, seats, updateSeat, handlePostGame, error } = props;

	const user = seats.find((seat) => seat.isUser)!;
	const selectedTagIds = new Set(user?.commentTagIds ?? []);

	const toggleTag = (id: number) => {
		if (!user) return;

		const next = new Set(user.commentTagIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);

		updateSeat({ ...user, commentTagIds: Array.from(next) });
	};

	return (
		<ScrollView style={{ gap: 8, padding: 8 }}>
			<Text style={{ fontSize: 20, fontWeight: 400 }}>How was the Game?</Text>
			{commentTags.map((tag) => {
				const selected = selectedTagIds.has(tag.id);
				return (
					<Button
						key={tag.id}
						mode={selected ? 'contained' : 'elevated'}
						onPress={() => toggleTag(tag.id)}
						style={{ borderRadius: 4 }}>
						{tag.label}
					</Button>
				);
			})}
			{error && <HelperText type='error'>{error}</HelperText>}
			<Button
				mode='outlined'
				onPress={handlePostGame}
				style={{ borderRadius: 8 }}
				loading={props.submitting}
				disabled={props.submitting}>
				Submit Game
			</Button>
		</ScrollView>
	);
};
