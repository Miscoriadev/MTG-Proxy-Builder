import { useState, useEffect } from 'react';
import { BackgroundsData } from '../types';

export function useBackgrounds() {
  const [backgrounds, setBackgrounds] = useState<BackgroundsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadBackgrounds() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/backgrounds.json`);
        if (!response.ok) {
          throw new Error('Failed to load background data');
        }
        const data: BackgroundsData = await response.json();
        setBackgrounds(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load backgrounds'));
      } finally {
        setLoading(false);
      }
    }
    loadBackgrounds();
  }, []);

  return { backgrounds, loading, error };
}
