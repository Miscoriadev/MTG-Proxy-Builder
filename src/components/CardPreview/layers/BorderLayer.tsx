import { BorderConfig, ManaColor } from '../../../types';
import { determineBorderColor } from '../../../utils/colorUtils';
import styles from '../CardPreview.module.css';

interface BorderLayerProps {
  border: BorderConfig;
  cardColors: ManaColor[] | undefined;
}

export function BorderLayer({ border, cardColors }: BorderLayerProps) {
  const borderColor = determineBorderColor(cardColors);
  const borderImagePath = border.images[borderColor] || border.images.C;

  return (
    <div className={styles.borderLayer}>
      <img
        src={borderImagePath}
        alt={`${border.name} border`}
        className={styles.borderImage}
        onError={(e) => {
          // Hide the border image if it fails to load
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}
