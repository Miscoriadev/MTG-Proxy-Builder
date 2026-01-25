import { ArtPosition } from '../../../types';
import styles from '../BorderEditor.module.css';

interface ArtPositionPanelProps {
  artPosition: ArtPosition | undefined;
  onChange: (artPosition: ArtPosition) => void;
}

export function ArtPositionPanel({ artPosition, onChange }: ArtPositionPanelProps) {
  const position = artPosition || { centerX: 50, centerY: 50, scale: 1 };

  const handleChange = (field: keyof ArtPosition, value: number) => {
    onChange({
      ...position,
      [field]: value,
    });
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Art Position</h3>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Center X (%)</label>
          <input
            type="number"
            className={styles.numberInput}
            value={position.centerX}
            onChange={(e) => handleChange('centerX', parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Center Y (%)</label>
          <input
            type="number"
            className={styles.numberInput}
            value={position.centerY}
            onChange={(e) => handleChange('centerY', parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.1}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Scale</label>
          <input
            type="number"
            className={styles.numberInput}
            value={position.scale}
            onChange={(e) => handleChange('scale', parseFloat(e.target.value) || 1)}
            min={0.1}
            max={10}
            step={0.1}
          />
        </div>
      </div>
    </div>
  );
}
