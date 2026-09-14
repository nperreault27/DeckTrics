
interface ScryfallAutocompleteResponse {
  object: string;
  total_values: number;
  data: string[];
}

export async function fetchSuggestions(query: string) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
        return [];
    }
    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(trimmedQuery)}`,
        {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CommanderStatTracker/1.0',
        },
      }
      );
      if (!response.ok) throw new Error('Network response error' + response.statusText);
      
      const json: ScryfallAutocompleteResponse = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error fetching from Scryfall:', error);
      return [];
    }}