import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ScryfallCard, BorderConfig, BackgroundImage, BackgroundsData } from '../types';

const CUSTOM_BACKGROUNDS_KEY = 'mtg-proxy-builder-custom-backgrounds';
const BG_SETTINGS_KEY = 'mtg-proxy-builder-background-settings';

const DEFAULT_TRANSFORM: BackgroundTransform = { scale: 1, offsetX: 0, offsetY: 0 };

export interface BackgroundTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface CardBgSettings {
  selectedBgUrl: string | null;
  transforms: Record<string, BackgroundTransform>;
}

function loadUserBackgrounds(): BackgroundsData {
  try {
    const raw = localStorage.getItem(CUSTOM_BACKGROUNDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadBgSettings(): Record<string, CardBgSettings> {
  try {
    const raw = localStorage.getItem(BG_SETTINGS_KEY);
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

  // Background settings persistence (selected bg + transforms per card)
  const bgSettingsRef = useRef(loadBgSettings());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevCardIdRef = useRef<string | null>(null);
  const isCardTransitionRef = useRef(false);

  const persistBgSettings = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(BG_SETTINGS_KEY, JSON.stringify(bgSettingsRef.current));
    }, 500);
  }, []);

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

  // Restore saved background selection + transform when card changes
  useEffect(() => {
    const cardId = selectedCard?.id ?? null;
    if (cardId === prevCardIdRef.current) return;
    prevCardIdRef.current = cardId;

    isCardTransitionRef.current = true;

    if (!cardId || availableBackgrounds.length === 0) {
      setBackgroundTransform(DEFAULT_TRANSFORM);
      return;
    }

    const saved = bgSettingsRef.current[cardId];
    if (saved?.selectedBgUrl) {
      const idx = availableBackgrounds.findIndex(bg => bg.url === saved.selectedBgUrl);
      if (idx !== -1) {
        setSelectedBackgroundIndex(idx);
        setBackgroundTransform(saved.transforms[saved.selectedBgUrl] || DEFAULT_TRANSFORM);
      } else {
        setSelectedBackgroundIndex(0);
        const firstUrl = availableBackgrounds[0]?.url;
        setBackgroundTransform(firstUrl && saved.transforms[firstUrl] || DEFAULT_TRANSFORM);
      }
    } else {
      setSelectedBackgroundIndex(0);
      setBackgroundTransform(DEFAULT_TRANSFORM);
    }
  }, [selectedCard?.id, availableBackgrounds]);

  // Persist background settings on transform/selection changes (debounced)
  useEffect(() => {
    if (isCardTransitionRef.current) {
      isCardTransitionRef.current = false;
      return;
    }
    const cardId = selectedCard?.id;
    const bgUrl = cardId ? availableBackgrounds[selectedBackgroundIndex]?.url : null;
    if (!cardId || !bgUrl) return;

    if (!bgSettingsRef.current[cardId]) {
      bgSettingsRef.current[cardId] = { selectedBgUrl: null, transforms: {} };
    }
    bgSettingsRef.current[cardId].selectedBgUrl = bgUrl;
    bgSettingsRef.current[cardId].transforms[bgUrl] = backgroundTransform;
    persistBgSettings();
  }, [selectedCard?.id, selectedBackgroundIndex, backgroundTransform, availableBackgrounds, persistBgSettings]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current);
      localStorage.setItem(BG_SETTINGS_KEY, JSON.stringify(bgSettingsRef.current));
    };
  }, []);

  const selectCard = useCallback((card: ScryfallCard) => {
    // Save current card's bg state before switching
    if (selectedCard) {
      const cardId = selectedCard.id;
      const bgUrl = availableBackgrounds[selectedBackgroundIndex]?.url;
      if (!bgSettingsRef.current[cardId]) {
        bgSettingsRef.current[cardId] = { selectedBgUrl: null, transforms: {} };
      }
      if (bgUrl) {
        bgSettingsRef.current[cardId].selectedBgUrl = bgUrl;
        bgSettingsRef.current[cardId].transforms[bgUrl] = backgroundTransform;
      }
      persistBgSettings();
    }
    setSelectedCard(card);
    // Index + transform restored by the card-change effect
  }, [selectedCard, selectedBackgroundIndex, backgroundTransform, availableBackgrounds, persistBgSettings]);

  const selectBorder = useCallback((border: BorderConfig) => {
    setSelectedBorderId(border.id);
  }, []);

  const selectBackground = useCallback((background: BackgroundImage) => {
    const newIndex = availableBackgrounds.findIndex(bg => bg.url === background.url);
    if (newIndex === -1) return;

    // Save current background's transform before switching
    const cardId = selectedCard?.id;
    if (cardId) {
      const currentBgUrl = availableBackgrounds[selectedBackgroundIndex]?.url;
      if (!bgSettingsRef.current[cardId]) {
        bgSettingsRef.current[cardId] = { selectedBgUrl: null, transforms: {} };
      }
      if (currentBgUrl) {
        bgSettingsRef.current[cardId].transforms[currentBgUrl] = backgroundTransform;
      }
      bgSettingsRef.current[cardId].selectedBgUrl = background.url;
      persistBgSettings();
    }

    setSelectedBackgroundIndex(newIndex);

    // Restore saved transform for the new background
    const savedTransform = cardId
      ? bgSettingsRef.current[cardId]?.transforms[background.url]
      : null;
    setBackgroundTransform(savedTransform || DEFAULT_TRANSFORM);
  }, [availableBackgrounds, selectedCard, selectedBackgroundIndex, backgroundTransform, persistBgSettings]);

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
