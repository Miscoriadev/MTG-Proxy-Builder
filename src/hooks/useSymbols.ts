import { useState, useEffect } from 'react';
import { SymbolsData } from '../types';

export function useSymbols() {
  const [symbols, setSymbols] = useState<SymbolsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/symbols.json`)
      .then(res => res.json())
      .then((data: SymbolsData) => {
        setSymbols(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { symbols, loading, error };
}
