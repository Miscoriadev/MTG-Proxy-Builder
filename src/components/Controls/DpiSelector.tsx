import styles from './Controls.module.css';

interface DpiOption {
  value: number;
  label: string;
}

const DPI_OPTIONS: DpiOption[] = [
  { value: 150, label: 'Draft (150 DPI)' },
  { value: 300, label: 'Print (300 DPI)' },
  { value: 500, label: 'High Quality (500 DPI)' },
  { value: 800, label: 'Professional (800 DPI)' },
];

interface DpiSelectorProps {
  selectedDpi: number;
  onDpiChange: (dpi: number) => void;
}

export function DpiSelector({ selectedDpi, onDpiChange }: DpiSelectorProps) {
  const width = Math.round(2.5 * selectedDpi);
  const height = Math.round(3.5 * selectedDpi);

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Export Quality</label>
      <select
        className={styles.select}
        value={selectedDpi}
        onChange={(e) => onDpiChange(Number(e.target.value))}
      >
        {DPI_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className={styles.dimensionInfo}>
        Output: {width} × {height} px
      </div>
    </div>
  );
}
