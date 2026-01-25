import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  BorderConfig,
  BorderColorImages,
  BorderTextPositions,
  TextPosition,
  ArtPosition,
  ManaSymbolPaths,
  ScryfallCard,
} from '../types';
import { BackgroundTransform } from './useCardBuilder';

const STORAGE_KEY = 'mtg-proxy-builder-border-editor-draft';
export const CUSTOM_BORDERS_STORAGE_KEY = 'mtg-proxy-builder-custom-borders';

// Generate a UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper function to load custom borders from localStorage
export function loadCustomBorders(): BorderConfig[] {
  const saved = localStorage.getItem(CUSTOM_BORDERS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse custom borders:', e);
    }
  }
  return [];
}

// Helper function to save a border to custom borders
function saveToCustomBordersStorage(config: BorderConfig): void {
  const customBorders = loadCustomBorders();
  const existingIndex = customBorders.findIndex((b) => b.id === config.id);
  if (existingIndex >= 0) {
    customBorders[existingIndex] = config;
  } else {
    customBorders.push(config);
  }
  localStorage.setItem(CUSTOM_BORDERS_STORAGE_KEY, JSON.stringify(customBorders));
}

// Default text position template
const defaultTextPosition = (
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number
): TextPosition => ({
  x,
  y,
  width,
  height,
  fontSize,
  fontFamily: 'Beleren2016, Beleren, serif',
  color: '#000000',
  align: 'left',
});

// Default new border configuration
const createDefaultConfig = (): BorderConfig => ({
  id: 'new-border',
  name: 'New Border',
  description: 'Custom border configuration',
  images: {
    W: '',
    U: '',
    B: '',
    R: '',
    G: '',
    C: '',
  },
  textPositions: {
    name: defaultTextPosition(14.1, 8.3, 53.6, 5.5, 9),
    manaCost: defaultTextPosition(67.9, 8.3, 19.1, 5.5, 7),
    typeLine: defaultTextPosition(14.1, 57.7, 72.6, 4.5, 8),
    oracleText: defaultTextPosition(14.1, 63.5, 72.6, 23.4, 8),
    flavorText: defaultTextPosition(14.1, 63.5, 72.6, 23.4, 7),
    powerToughness: defaultTextPosition(75.4, 88.2, 12.2, 5, 10),
  },
  manaSymbols: {
    W: '/symbols/W.svg',
    U: '/symbols/U.svg',
    B: '/symbols/B.svg',
    R: '/symbols/R.svg',
    G: '/symbols/G.svg',
    C: '/symbols/C.svg',
    T: '/symbols/T.svg',
  },
  art: {
    centerX: 50,
    centerY: 37,
    scale: 1,
  },
});

export function useBorderEditor(builtInBorders: BorderConfig[]) {
  // Main editing config
  const [editingConfig, setEditingConfig] = useState<BorderConfig>(createDefaultConfig);

  // Custom borders from localStorage
  const [customBorders, setCustomBorders] = useState<BorderConfig[]>(() => loadCustomBorders());

  // Track if we have an active config being edited
  const [hasActiveConfig, setHasActiveConfig] = useState<boolean>(false);

  // Combined list of all available borders (built-in + custom)
  const allBorders = useMemo(() => {
    return [...builtInBorders, ...customBorders];
  }, [builtInBorders, customBorders]);

  // Selection state
  const [selectedTextPositionKey, setSelectedTextPositionKey] = useState<string | null>(null);

  // Preview state
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null);
  const [backgroundTransform, setBackgroundTransform] = useState<BackgroundTransform>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  // Load from localStorage on mount and determine if we have an active config
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const currentCustomBorders = loadCustomBorders();
    setCustomBorders(currentCustomBorders);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if the saved draft is a custom border (exists in custom borders list)
        const isCustomBorder = currentCustomBorders.some((b) => b.id === parsed.id);
        if (isCustomBorder) {
          setEditingConfig(parsed);
          setHasActiveConfig(true);
        } else {
          // Draft exists but doesn't match a custom border - no active config
          setHasActiveConfig(false);
        }
      } catch (e) {
        console.warn('Failed to load saved border config:', e);
        setHasActiveConfig(false);
      }
    } else {
      setHasActiveConfig(false);
    }
  }, []);

  // Auto-save to localStorage and custom borders when config changes
  useEffect(() => {
    // Only save if we have an active config
    if (!hasActiveConfig) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(editingConfig));

    // Only save to custom borders if it's not a built-in border
    const isBuiltIn = builtInBorders.some((b) => b.id === editingConfig.id);
    if (!isBuiltIn) {
      saveToCustomBordersStorage(editingConfig);
      // Refresh the custom borders list
      setCustomBorders(loadCustomBorders());
    }
  }, [editingConfig, builtInBorders, hasActiveConfig]);

  // Update general info (id, name, description)
  const updateGeneralInfo = useCallback(
    (updates: Partial<Pick<BorderConfig, 'id' | 'name' | 'description'>>) => {
      setEditingConfig((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    []
  );

  // Update a single text position
  const updateTextPosition = useCallback((key: string, position: TextPosition) => {
    setEditingConfig((prev) => ({
      ...prev,
      textPositions: {
        ...prev.textPositions,
        [key]: position,
      } as BorderTextPositions,
    }));
  }, []);

  // Update border images
  const updateBorderImages = useCallback((images: BorderColorImages) => {
    setEditingConfig((prev) => ({
      ...prev,
      images,
    }));
  }, []);

  // Update art position
  const updateArtPosition = useCallback((artPosition: ArtPosition) => {
    setEditingConfig((prev) => ({
      ...prev,
      art: artPosition,
    }));
  }, []);

  // Update mana symbols
  const updateManaSymbols = useCallback((manaSymbols: ManaSymbolPaths) => {
    setEditingConfig((prev) => ({
      ...prev,
      manaSymbols,
    }));
  }, []);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Export as JSON file
  const exportAsJson = useCallback(() => {
    const json = JSON.stringify(editingConfig, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${editingConfig.id}-border.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [editingConfig]);

  // Import from JSON file - always creates a new border with new UUID
  const importFromJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as BorderConfig;
        // Validate it has required fields
        if (parsed.name && parsed.images && parsed.textPositions) {
          // Always assign a new UUID when importing
          parsed.id = generateUUID();
          setEditingConfig(parsed);
          setSelectedTextPositionKey(null);
          setHasActiveConfig(true);
        } else {
          console.error('Invalid border config file');
        }
      } catch (err) {
        console.error('Failed to parse JSON file:', err);
      }
    };
    reader.readAsText(file);
  }, []);

  // Load from existing border config (only custom borders should be loaded here)
  const loadFromExisting = useCallback((config: BorderConfig) => {
    const newConfig = JSON.parse(JSON.stringify(config)) as BorderConfig; // Deep copy
    setEditingConfig(newConfig);
    setSelectedTextPositionKey(null);
    setHasActiveConfig(true);
  }, []);

  // Create new config based on classic border
  const createNew = useCallback(() => {
    const classicBorder = builtInBorders.find((b) => b.id === 'classic');
    if (classicBorder) {
      // Deep copy the classic border and give it a new id/name
      const newConfig = JSON.parse(JSON.stringify(classicBorder)) as BorderConfig;
      newConfig.id = generateUUID();
      newConfig.name = 'New Custom Border';
      newConfig.description = 'Custom border configuration';
      setEditingConfig(newConfig);
    } else {
      const defaultConfig = createDefaultConfig();
      defaultConfig.id = generateUUID();
      setEditingConfig(defaultConfig);
    }
    setSelectedTextPositionKey(null);
    setHasActiveConfig(true);
  }, [builtInBorders]);

  // Delete a custom border from storage
  const deleteCustomBorder = useCallback((borderId: string) => {
    const saved = localStorage.getItem(CUSTOM_BORDERS_STORAGE_KEY);
    if (saved) {
      try {
        const savedBorders: BorderConfig[] = JSON.parse(saved);
        const filtered = savedBorders.filter((b) => b.id !== borderId);
        localStorage.setItem(CUSTOM_BORDERS_STORAGE_KEY, JSON.stringify(filtered));
        setCustomBorders(filtered);

        // Clear the draft from localStorage
        localStorage.removeItem(STORAGE_KEY);
        setSelectedTextPositionKey(null);
        setHasActiveConfig(false);
      } catch (e) {
        console.warn('Failed to delete custom border:', e);
      }
    }
  }, []);

  return {
    // Config state
    editingConfig,
    setEditingConfig,
    existingBorders: allBorders,
    customBorders,
    hasActiveConfig,

    // Selection state
    selectedTextPositionKey,
    setSelectedTextPositionKey,

    // Preview state
    previewCard,
    setPreviewCard,
    backgroundTransform,
    setBackgroundTransform,

    // Update functions
    updateGeneralInfo,
    updateTextPosition,
    updateBorderImages,
    updateArtPosition,
    updateManaSymbols,

    // Persistence
    clearLocalStorage,

    // Import/Export
    exportAsJson,
    importFromJson,

    // Initialize
    loadFromExisting,
    createNew,

    // Custom borders
    deleteCustomBorder,
  };
}
