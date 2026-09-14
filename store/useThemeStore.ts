import { create } from 'zustand';
import { ThemeName, themes } from '@/lib/themes';

type ThemeState = {
  themeName: ThemeName;
  setThemeName: (themeName: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeName: 'mythic',
  setThemeName: (themeName) => set({ themeName }),
}));

export const getCurrentTheme = (themeName: ThemeName) => themes[themeName];
