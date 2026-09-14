import { create } from 'zustand';
import { GameListItem, listGames, createGame, NewGameInput } from '@/lib/db';

type GamesState = {
  games: GameListItem[];
  loading: boolean;
  loadGames: () => Promise<void>;
  logGame: (input: NewGameInput) => Promise<number>;
};

export const useGamesStore = create<GamesState>((set, get) => ({
  games: [],
  loading: false,

  loadGames: async () => {
    set({ loading: true });
    const games = await listGames();
    set({ games, loading: false });
  },

  logGame: async (input) => {
    const id = await createGame(input);
    await get().loadGames();
    return id;
  },
}));
