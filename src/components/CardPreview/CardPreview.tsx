import { forwardRef } from 'react';
import { ScryfallCard, BorderConfig, BackgroundImage, SymbolsData } from '../../types';
import { CardCanvas, CardCanvasHandle } from './CardCanvas';
import { BackgroundTransform } from '../../utils/canvasRenderer';
import styles from './CardPreview.module.css';

interface CardPreviewProps {
  card: ScryfallCard | null;
  border: BorderConfig | null;
  background: BackgroundImage | null;
  backgroundTransform?: BackgroundTransform;
  onBackgroundTransformChange?: (transform: BackgroundTransform) => void;
  dpi: number;
  symbolsData?: SymbolsData;
}

export const CardPreview = forwardRef<CardCanvasHandle, CardPreviewProps>(
  function CardPreview({ card, border, background, backgroundTransform, onBackgroundTransformChange, dpi, symbolsData }, ref) {
    if (!card || !border) {
      return (
        <div className={styles.cardContainer}>
          <div className={styles.placeholder}>
            Select a card to begin customizing
          </div>
        </div>
      );
    }

    const backgroundUrl = background?.url || card.image_uris?.art_crop || null;

    return (
      <div className={styles.cardContainer}>
        <div className={styles.cardFrame}>
          <CardCanvas
            ref={ref}
            card={card}
            border={border}
            backgroundUrl={backgroundUrl}
            backgroundTransform={backgroundTransform}
            onBackgroundTransformChange={onBackgroundTransformChange}
            dpi={dpi}
            symbolsData={symbolsData}
          />
        </div>
      </div>
    );
  }
);
