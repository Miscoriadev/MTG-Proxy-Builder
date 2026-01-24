import { useState, useMemo, useCallback, useEffect } from 'react';
import { ScryfallCard, BorderConfig, BackgroundImage, BackgroundsData } from '../types';

export interface BackgroundTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function useCardBuilder(
  borders: BorderConfig[],
  backgrounds: BackgroundsData
) {
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [selectedBorderId, setSelectedBorderId] = useState<string | null>(null);
  const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState<number>(0);
  const [dpi, setDpi] = useState<number>(300);
  const [backgroundTransform, setBackgroundTransform] = useState<BackgroundTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  // Margin in mm for print export (0-5mm range, supports decimals)
  const [exportMarginMm, setExportMarginMm] = useState<number>(0);

  // Reset transform when background changes
  useEffect(() => {
    setBackgroundTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }, [selectedBackgroundIndex]);

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
    setSelectedCard(card);
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
    backgroundTransform,
    dpi,
    exportMarginMm,
    selectCard,
    selectBorder,
    selectBackground,
    setBackgroundTransform,
    setDpi,
    setExportMarginMm,
  };
}
