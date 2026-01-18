import { useState, useCallback, useRef, useEffect } from 'react';
import { ScryfallCard } from '../../types';
import { scryfallApi } from '../../services/scryfallApi';
import styles from './Controls.module.css';

interface CardSelectorProps {
  selectedCard: ScryfallCard | null;
  onSelect: (card: ScryfallCard) => void;
}

export function CardSelector({ selectedCard, onSelect }: CardSelectorProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [skipNextSearch, setSkipNextSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced autocomplete search
  useEffect(() => {
    if (skipNextSearch) {
      setSkipNextSearch(false);
      return;
    }

    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await scryfallApi.autocomplete(query);
      setSuggestions(results);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, skipNextSearch]);

  const handleSelect = useCallback(async (name: string) => {
    setIsLoading(true);
    const card = await scryfallApi.getCardByName(name);
    if (card) {
      onSelect(card);
      setSkipNextSearch(true);
      setQuery(card.name);
    }
    setIsLoading(false);
    setIsOpen(false);
    setSuggestions([]);
  }, [onSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedCard) {
      setSkipNextSearch(true);
      setQuery(selectedCard.name);
    }
  }, [selectedCard]);

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Select Card</label>
      <div className={styles.selectorContainer} ref={containerRef}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={`${styles.input} ${isLoading ? styles.inputWithSpinner : ''}`}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder="Search cards..."
          />
          {isLoading && <div className={styles.spinner} />}
        </div>
        {isOpen && suggestions.length > 0 && !isLoading && (
          <ul className={styles.dropdown}>
            {suggestions.map(name => (
              <li
                key={name}
                className={styles.option}
                onClick={() => handleSelect(name)}
              >
                <span className={styles.cardName}>{name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
