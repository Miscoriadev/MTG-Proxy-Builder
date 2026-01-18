import { useState, useEffect } from 'react';
import { BorderConfig, BordersData } from '../types';

export function useBorders() {
  const [borders, setBorders] = useState<BorderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadBorders() {
      try {
        const response = await fetch('/data/borders.json');
        if (!response.ok) {
          throw new Error('Failed to load border data');
        }
        const data: BordersData = await response.json();
        setBorders(data.borders);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load borders'));
      } finally {
        setLoading(false);
      }
    }
    loadBorders();
  }, []);

  return { borders, loading, error };
}
