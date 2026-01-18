import { BackgroundImage } from '../../../types';
import styles from '../CardPreview.module.css';

interface BackgroundLayerProps {
  image: BackgroundImage | null;
  fallback?: string;
}

export function BackgroundLayer({ image, fallback }: BackgroundLayerProps) {
  const imageUrl = image?.url || fallback;

  if (!imageUrl) {
    return <div className={styles.backgroundLayer} />;
  }

  return (
    <div className={styles.backgroundLayer}>
      <img
        src={imageUrl}
        alt="Card background"
        className={styles.backgroundImage}
        loading="lazy"
      />
    </div>
  );
}
