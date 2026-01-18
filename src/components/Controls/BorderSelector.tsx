import { BorderConfig } from '../../types';
import styles from './Controls.module.css';

interface BorderSelectorProps {
  borders: BorderConfig[];
  selectedBorder: BorderConfig | null;
  onSelect: (border: BorderConfig) => void;
}

export function BorderSelector({ borders, selectedBorder, onSelect }: BorderSelectorProps) {
  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Border Style</label>
      <select
        className={styles.select}
        value={selectedBorder?.id || ''}
        onChange={(e) => {
          const border = borders.find(b => b.id === e.target.value);
          if (border) onSelect(border);
        }}
      >
        <option value="" disabled>Select a border...</option>
        {borders.map(border => (
          <option key={border.id} value={border.id}>
            {border.name}
          </option>
        ))}
      </select>
    </div>
  );
}
