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


// { id: 0, name: 'Default Deck', commander: 'commander1' },
// { id: 1, name: 'Default Deck 2', commander: 'commander2' },
// { id: 2, name: 'Default Deck 3', commander: 'commander3' },
// { id: 3, name: 'Default Deck 4', commander: 'commander4' }, 
// { id: 4, name: 'Default Deck 5', commander: 'commander5' }, 
// { id: 5, name: 'Default Deck 6', commander: 'commander6' }, 
// { id: 6, name: 'Default Deck 7', commander: 'commander7' }, 
// { id: 7, name: 'Default Deck 8', commander: 'commander8' }, 
// { id: 8, name: 'Default Deck 9', commander: 'commander9' }, 
// { id: 9, name: 'Default Deck 10', commander: 'commander10' }