import { useRef } from 'react';
import { BorderConfig, BackgroundsData, SymbolsData } from '../../types';
import { useCardBuilder } from '../../hooks';
import { CardPreview, CardCanvasHandle } from '../CardPreview';
import { CardSelector, BorderSelector, BackgroundSelector, DpiSelector } from '../Controls';
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
    dpi,
    selectCard,
    selectBorder,
    selectBackground,
    setDpi,
  } = useCardBuilder(borders, backgrounds);

  const handleDownload = () => {
    canvasRef.current?.download();
  };

  return (
    <div className={styles.container}>
      <div className={styles.previewSection}>
        <CardPreview
          ref={canvasRef}
          card={selectedCard}
          border={selectedBorder}
          background={selectedBackground}
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
