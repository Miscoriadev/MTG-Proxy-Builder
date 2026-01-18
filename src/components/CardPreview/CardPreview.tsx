import { ScryfallCard, BorderConfig, BackgroundImage } from '../../types';
import { BackgroundLayer } from './layers/BackgroundLayer';
import { BorderLayer } from './layers/BorderLayer';
import { TextOverlayLayer } from './layers/TextOverlayLayer';
import styles from './CardPreview.module.css';

interface CardPreviewProps {
  card: ScryfallCard | null;
  border: BorderConfig | null;
  background: BackgroundImage | null;
}

export function CardPreview({ card, border, background }: CardPreviewProps) {
  if (!card) {
    return (
      <div className={styles.cardContainer}>
        <div className={styles.placeholder}>
          Select a card to begin customizing
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cardContainer}>
      <div className={styles.cardFrame}>
        {/* Layer 1: Background */}
        <BackgroundLayer
          image={background}
          fallback={card.image_uris?.art_crop}
        />

        {/* Layer 2: Border Frame */}
        {border && (
          <BorderLayer
            border={border}
            cardColors={card.colors}
          />
        )}

        {/* Layer 3: Text Overlays */}
        {border && (
          <TextOverlayLayer
            card={card}
            positions={border.textPositions}
          />
        )}
      </div>
    </div>
  );
}
