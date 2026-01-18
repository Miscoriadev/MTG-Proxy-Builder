import { BackgroundImage } from '../../types';
import styles from './Controls.module.css';

interface BackgroundSelectorProps {
  backgrounds: BackgroundImage[];
  selectedBackground: BackgroundImage | null;
  onSelect: (background: BackgroundImage) => void;
}

export function BackgroundSelector({ backgrounds, selectedBackground, onSelect }: BackgroundSelectorProps) {
  if (backgrounds.length === 0) {
    return (
      <div className={styles.controlGroup}>
        <label className={styles.label}>Background</label>
        <div className={styles.noBackgrounds}>
          Select a card to see available backgrounds
        </div>
      </div>
    );
  }

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Background</label>
      <div className={styles.thumbnailGrid}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`${styles.thumbnail} ${selectedBackground?.url === bg.url ? styles.selected : ''}`}
            onClick={() => onSelect(bg)}
            title={bg.label || `Background ${index + 1}`}
          >
            <img
              src={bg.url}
              alt={bg.label || `Background ${index + 1}`}
              className={styles.thumbnailImage}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
