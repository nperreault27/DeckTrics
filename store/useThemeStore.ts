import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeName } from '@/lib/themes';

type ThemeState = {
  themeName: ThemeName;
  setThemeName: (themeName: ThemeName) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeName: 'mythic',
      setThemeName: (themeName) => set({ themeName }),
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
