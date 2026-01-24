import { useRef } from 'react';
import { BorderConfig, BackgroundsData, SymbolsData } from '../../types';
import { useCardBuilder } from '../../hooks';
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
  } = useCardBuilder(borders, backgrounds);

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
        />
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlPanel}>
          <CardSelector
            selectedCard={selectedCard}
            onSelect={selectCard}
          />

          <BorderSelector
            borders={borders}
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
