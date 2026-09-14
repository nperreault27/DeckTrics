import { MD3DarkTheme } from 'react-native-paper';

export type ThemeName = 'mythic' | 'rare' | 'uncommon' | 'common';

export const themeNames: ThemeName[] = [
  'mythic',
  'rare',
  'uncommon',
  'common',
];

export const themes: Record<ThemeName, typeof MD3DarkTheme> = {
  mythic: {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#E0562A',
        onPrimary: '#17111F',
        primaryContainer: '#A3341F',
        onPrimaryContainer: '#F4F1F8',
        secondary: '#FF8A3D',
        tertiary: '#9990A3',
        background: '#17111F',
        surface: '#271D33',
        surfaceVariant: '#271D33',
        outline: '#3D2F4E',
    },
},
rare: {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#B8933A',
        onPrimary: '#181209',
        primaryContainer: '#7D6224',
        onPrimaryContainer: '#F6F0E2',
        secondary: '#E8C25A',
        tertiary: '#AFAFAF',
        background: '#181209',
        surface: '#2A2113',
        surfaceVariant: '#2A2113',
        outline: '#443722',
    },
    },
uncommon: {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#8FA1B0',
        onPrimary: '#0F151B',
        primaryContainer: '#5B6C7B',
        onPrimaryContainer: '#EEF3F7',
        secondary: '#C6D2DC',
        tertiary: '#919AA4',
        background: '#0F151B',
        surface: '#1D262F',
        surfaceVariant: '#1D262F',
        outline: '#334150',
    },
},
common: {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#B4B4B4',
        onPrimary: '#0D0D0D',
        primaryContainer: '#6E6E6E',
        onPrimaryContainer: '#FFFFFF',
        secondary: '#FFFFFF',
        tertiary: '#999999',
        background: '#0D0D0D',
        surface: '#1C1C1C',
        surfaceVariant: '#1C1C1C',
        outline: '#333333',
    },
    },
};
