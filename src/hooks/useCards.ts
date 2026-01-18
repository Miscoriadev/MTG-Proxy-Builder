import { useState, useEffect } from 'react';
import { ScryfallCard } from '../types';

export function useCards() {
  const [cards, setCards] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadCards() {
      try {
        const response = await fetch('/data/cardlist.json');
        if (!response.ok) {
          throw new Error('Failed to load card data');
        }
        const data = await response.json();
        setCards(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load cards'));
      } finally {
        setLoading(false);
      }
    }
    loadCards();
  }, []);

  return { cards, loading, error };
}
