import { useState, useMemo, useCallback, useEffect } from 'react';
import { ScryfallCard, BorderConfig, BackgroundImage, BackgroundsData } from '../types';

const CUSTOM_BACKGROUNDS_KEY = 'mtg-proxy-builder-custom-backgrounds';

export interface BackgroundTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

function loadUserBackgrounds(): BackgroundsData {
  try {
    const raw = localStorage.getItem(CUSTOM_BACKGROUNDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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

  // User-uploaded backgrounds persisted in localStorage
  const [userBackgrounds, setUserBackgrounds] = useState<BackgroundsData>(loadUserBackgrounds);

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
    const jsonBackgrounds = backgrounds[selectedCard.id] || [];
    result.push(...jsonBackgrounds);

    // Add user-uploaded backgrounds from localStorage
    const uploaded = userBackgrounds[selectedCard.id] || [];
    result.push(...uploaded);

    return result;
  }, [selectedCard, backgrounds, userBackgrounds]);

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

  const addCustomBackground = useCallback((url: string) => {
    if (!selectedCard) return;
    const cardId = selectedCard.id;
    setUserBackgrounds(prev => {
      const existing = prev[cardId] || [];
      // Don't add duplicates
      if (existing.some(bg => bg.url === url)) return prev;
      const updated = {
        ...prev,
        [cardId]: [...existing, { url, label: `Upload ${existing.length + 1}`, source: 'custom' as const }],
      };
      localStorage.setItem(CUSTOM_BACKGROUNDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [selectedCard]);

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
    addCustomBackground,
    setBackgroundTransform,
    setDpi,
    setExportMarginMm,
  };
}
