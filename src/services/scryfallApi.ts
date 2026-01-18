import { ScryfallCard } from '../types';

const BASE_URL = 'https://api.scryfall.com';

interface AutocompleteResponse {
  object: 'catalog';
  total_values: number;
  data: string[];
}

class ScryfallApi {
  private lastRequestTime = 0;
  private minRequestInterval = 100; // 100ms between requests per Scryfall guidelines

  private async throttledFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();

    return fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async autocomplete(query: string): Promise<string[]> {
    if (query.length < 2) return [];

    try {
      const response = await this.throttledFetch(
        `${BASE_URL}/cards/autocomplete?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) return [];

      const data: AutocompleteResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  async getCardByName(name: string): Promise<ScryfallCard | null> {
    try {
      // Try exact match first
      const response = await this.throttledFetch(
        `${BASE_URL}/cards/named?exact=${encodeURIComponent(name)}`
      );

      if (response.ok) {
        return response.json();
      }

      // Fall back to fuzzy match
      const fuzzyResponse = await this.throttledFetch(
        `${BASE_URL}/cards/named?fuzzy=${encodeURIComponent(name)}`
      );

      if (fuzzyResponse.ok) {
        return fuzzyResponse.json();
      }

      return null;
    } catch (error) {
      console.error('Get card by name error:', error);
      return null;
    }
  }
}

export const scryfallApi = new ScryfallApi();
