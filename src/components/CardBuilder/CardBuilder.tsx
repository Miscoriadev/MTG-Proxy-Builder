import { ScryfallCard, BorderConfig, BackgroundsData } from '../../types';
import { useCardBuilder } from '../../hooks';
import { CardPreview } from '../CardPreview';
import { CardSelector, BorderSelector, BackgroundSelector } from '../Controls';
import styles from './CardBuilder.module.css';

interface CardBuilderProps {
  cards: ScryfallCard[];
  borders: BorderConfig[];
  backgrounds: BackgroundsData;
}

export function CardBuilder({ cards, borders, backgrounds }: CardBuilderProps) {
  const {
    selectedCard,
    selectedBorder,
    selectedBackground,
    availableBackgrounds,
    selectCard,
    selectBorder,
    selectBackground,
  } = useCardBuilder(cards, borders, backgrounds);

  return (
    <div className={styles.container}>
      <div className={styles.previewSection}>
        <CardPreview
          card={selectedCard}
          border={selectedBorder}
          background={selectedBackground}
        />
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlPanel}>
          <CardSelector
            cards={cards}
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
        </div>
      </div>
    </div>
  );
}
