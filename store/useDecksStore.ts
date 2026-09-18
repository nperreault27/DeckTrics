import { create } from 'zustand';
import { Deck, listDecks, createDeck } from '@/lib/db';

type DecksState = {
  decks: Deck[];
  loading: boolean;
  loadDecks: () => Promise<void>;
  addDeck: (name: string, commander?: string, isUsers?: boolean) => Promise<number>;
};

export const useDecksStore = create<DecksState>((set, get) => ({
  decks: [],
  loading: false,

  loadDecks: async () => {
    set({ loading: true });
    const decks = await listDecks();
    set({ decks, loading: false });
  },

  addDeck: async (name, commander, isUsers = false) => {
    const id = await createDeck(name, isUsers, commander);
    await get().loadDecks();
    return id;
  },
}));
