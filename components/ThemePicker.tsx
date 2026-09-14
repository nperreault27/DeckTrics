import { Image, Pressable } from 'react-native';
import { Menu } from 'react-native-paper';
import { ThemeName, themes } from '@/lib/themes';
import { useThemeStore } from '@/store/useThemeStore';
import { useState } from 'react';

export function ThemePicker() {
	const theme = useTheme();
	const [visible, setVisible] = useState(false);
	const { themeName, setThemeName } = useThemeStore();

	return (
		<Menu
			style={{ backgroundColor: theme.colors.outline }}
			contentStyle={{ backgroundColor: theme.colors.outline }}
			visible={visible}
			onDismiss={() => setVisible(false)}
			anchor={
				<Pressable onPress={() => setVisible(true)} style={{ padding: 0, margin: 0 }}>
					<ThemeIcon />
				</Pressable>
			}>
			{(Object.keys(themes) as ThemeName[]).map((name) => (
				<Menu.Item
					key={name}
					title={name[0].toUpperCase() + name.slice(1)}
					leadingIcon={name === themeName ? 'check' : undefined}
					onPress={() => {
						setThemeName(name);
						setVisible(false);
					}}
				/>
			))}
		</Menu>
	);
}

import Svg, { G, Rect } from 'react-native-svg';
import { useTheme } from 'react-native-paper';

function ThemeIcon({ size = 56, isCommon }: { size?: number; isCommon?: boolean }) {
	const theme = useTheme();

	return (
		<Svg width={size} height={size} viewBox='0 0 108 108'>
			<G transform='translate(20.04 20.68) scale(0.6591)'>
				<Rect
					x='8'
					y='26'
					width='14'
					height='48'
					fill={isCommon ? 'white' : theme.colors.primaryContainer}
				/>
				<Rect
					x='25'
					y='14'
					width='14'
					height='60'
					fill={isCommon ? 'white' : theme.colors.primary}
				/>
				<Rect
					x='43'
					y='4'
					width='14'
					height='70'
					fill={isCommon ? 'white' : theme.colors.secondary}
				/>
				<Rect
					x='61'
					y='14'
					width='14'
					height='60'
					fill={isCommon ? 'white' : theme.colors.primary}
				/>
				<Rect
					x='78'
					y='26'
					width='14'
					height='48'
					fill={isCommon ? 'white' : theme.colors.primaryContainer}
				/>
				<Rect
					x='8'
					y='78'
					width='84'
					height='14'
					fill={isCommon ? 'white' : theme.colors.onPrimaryContainer}
				/>
			</G>
		</Svg>
	);
}
