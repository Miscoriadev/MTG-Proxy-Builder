import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { BorderConfig, BackgroundsData, SymbolsData } from '../../types';
import { useCardBuilder, loadCustomBorders, CUSTOM_BORDERS_STORAGE_KEY } from '../../hooks';
import { CardPreview, CardCanvasHandle } from '../CardPreview';
import { CardSelector, BorderSelector, BackgroundSelector, DpiSelector, MarginSelector } from '../Controls';
import styles from './CardBuilder.module.css';
import controlStyles from '../Controls/Controls.module.css';

interface CardBuilderProps {
  borders: BorderConfig[];
  backgrounds: BackgroundsData;
  symbols: SymbolsData;
}

export function CardBuilder({ borders, backgrounds, symbols }: CardBuilderProps) {
  const canvasRef = useRef<CardCanvasHandle>(null);

  // Check for debug query parameter
  const debug = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  }, []);

  // Load custom borders from localStorage
  const [customBorders, setCustomBorders] = useState<BorderConfig[]>(() => loadCustomBorders());

  // Reload custom borders when localStorage changes or component mounts
  const reloadCustomBorders = useCallback(() => {
    setCustomBorders(loadCustomBorders());
  }, []);

  // Listen for storage events (when another tab/the editor updates custom borders)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CUSTOM_BORDERS_STORAGE_KEY) {
        reloadCustomBorders();
      }
    };

    // Also reload when window gains focus (user may have switched from editor)
    const handleFocus = () => {
      reloadCustomBorders();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [reloadCustomBorders]);

  // Combine built-in borders with custom borders
  const allBorders = useMemo(() => {
    return [...borders, ...customBorders];
  }, [borders, customBorders]);

  const {
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
  } = useCardBuilder(allBorders, backgrounds);

  const handleDownload = () => {
    canvasRef.current?.download(exportMarginMm);
  };

  return (
    <div className={styles.container}>
      <div className={styles.previewSection}>
        <CardPreview
          ref={canvasRef}
          card={selectedCard}
          border={selectedBorder}
          background={selectedBackground}
          backgroundTransform={backgroundTransform}
          onBackgroundTransformChange={setBackgroundTransform}
          dpi={dpi}
          symbolsData={symbols}
          debug={debug}
        />
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlPanel}>
          <CardSelector
            selectedCard={selectedCard}
            onSelect={selectCard}
          />

          <BorderSelector
            borders={allBorders}
            selectedBorder={selectedBorder}
            onSelect={selectBorder}
          />

          <BackgroundSelector
            backgrounds={availableBackgrounds}
            selectedBackground={selectedBackground}
            onSelect={selectBackground}
          />

          <DpiSelector
            selectedDpi={dpi}
            onDpiChange={setDpi}
          />

          <MarginSelector
            selectedMargin={exportMarginMm}
            onMarginChange={setExportMarginMm}
            dpi={dpi}
          />

          <button
            className={controlStyles.downloadButton}
            onClick={handleDownload}
            disabled={!selectedCard || !selectedBorder}
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
