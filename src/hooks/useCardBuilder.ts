import { useState, useMemo, useCallback } from 'react';
import { ScryfallCard, BorderConfig, BackgroundImage, BackgroundsData } from '../types';

export function useCardBuilder(
  cards: ScryfallCard[],
  borders: BorderConfig[],
  backgrounds: BackgroundsData
) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedBorderId, setSelectedBorderId] = useState<string | null>(null);
  const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState<number>(0);
  const [dpi, setDpi] = useState<number>(300);

  const selectedCard = useMemo(
    () => cards.find(c => c.id === selectedCardId) || null,
    [cards, selectedCardId]
  );

  const selectedBorder = useMemo(
    () => borders.find(b => b.id === selectedBorderId) || borders[0] || null,
    [borders, selectedBorderId]
  );

  const availableBackgrounds = useMemo(() => {
    if (!selectedCard) return [];

    const result: BackgroundImage[] = [];

    // Add default Scryfall art_crop
    if (selectedCard.image_uris?.art_crop) {
      result.push({
        url: selectedCard.image_uris.art_crop,
        label: 'Default Art',
        source: 'scryfall'
      });
    }

    // Add custom backgrounds from backgrounds.json
    const customBackgrounds = backgrounds[selectedCard.id] || [];
    result.push(...customBackgrounds);

    return result;
  }, [selectedCard, backgrounds]);

  const selectedBackground = useMemo(
    () => availableBackgrounds[selectedBackgroundIndex] || availableBackgrounds[0] || null,
    [availableBackgrounds, selectedBackgroundIndex]
  );

  const selectCard = useCallback((card: ScryfallCard) => {
    setSelectedCardId(card.id);
    setSelectedBackgroundIndex(0);
  }, []);

  const selectBorder = useCallback((border: BorderConfig) => {
    setSelectedBorderId(border.id);
  }, []);

  const selectBackground = useCallback((background: BackgroundImage) => {
    const index = availableBackgrounds.findIndex(bg => bg.url === background.url);
    if (index !== -1) {
      setSelectedBackgroundIndex(index);
    }
  }, [availableBackgrounds]);

  return {
    selectedCard,
    selectedBorder,
    selectedBackground,
    availableBackgrounds,
    dpi,
    selectCard,
    selectBorder,
    selectBackground,
    setDpi,
  };
}
