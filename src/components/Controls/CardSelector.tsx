import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ScryfallCard } from '../../types';
import styles from './Controls.module.css';

interface CardSelectorProps {
  cards: ScryfallCard[];
  selectedCard: ScryfallCard | null;
  onSelect: (card: ScryfallCard) => void;
}

export function CardSelector({ cards, selectedCard, onSelect }: CardSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCards = useMemo(() => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    return cards
      .filter(card => card.name.toLowerCase().includes(searchTerm))
      .slice(0, 50);
  }, [cards, query]);

  const handleSelect = useCallback((card: ScryfallCard) => {
    onSelect(card);
    setQuery(card.name);
    setIsOpen(false);
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
    if (selectedCard && !query) {
      setQuery(selectedCard.name);
    }
  }, [selectedCard, query]);

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Select Card</label>
      <div className={styles.selectorContainer} ref={containerRef}>
        <input
          type="text"
          className={styles.input}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search cards..."
        />
        {isOpen && filteredCards.length > 0 && (
          <ul className={styles.dropdown}>
            {filteredCards.map(card => (
              <li
                key={card.id}
                className={styles.option}
                onClick={() => handleSelect(card)}
              >
                <span className={styles.cardName}>{card.name}</span>
                <span className={styles.cardType}>{card.type_line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
