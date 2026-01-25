import { TextPosition } from '../../../types';
import styles from '../BorderEditor.module.css';

interface TextPositionSettingsProps {
  positionKey: string;
  position: TextPosition;
  onChange: (position: TextPosition) => void;
}

const POSITION_LABELS: Record<string, string> = {
  name: 'Card Name',
  manaCost: 'Mana Cost',
  typeLine: 'Type Line',
  oracleText: 'Oracle Text',
  flavorText: 'Flavor Text',
  powerToughness: 'Power/Toughness',
  loyalty: 'Loyalty',
  artist: 'Artist',
  copyright: 'Copyright',
};

export function TextPositionSettings({
  positionKey,
  position,
  onChange,
}: TextPositionSettingsProps) {
  const handleChange = <K extends keyof TextPosition>(field: K, value: TextPosition[K]) => {
    onChange({
      ...position,
      [field]: value,
    });
  };

  const handleNumberChange = (field: keyof TextPosition, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      handleChange(field, num as TextPosition[typeof field]);
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>{POSITION_LABELS[positionKey] || positionKey} Settings</h3>

      {/* Position */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldGroupLabel}>Position (%)</span>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>X</label>
            <input
              type="number"
              className={styles.numberInput}
              value={position.x}
              onChange={(e) => handleNumberChange('x', e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Y</label>
            <input
              type="number"
              className={styles.numberInput}
              value={position.y}
              onChange={(e) => handleNumberChange('y', e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldGroupLabel}>Size (%)</span>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Width</label>
            <input
              type="number"
              className={styles.numberInput}
              value={position.width}
              onChange={(e) => handleNumberChange('width', e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Height</label>
            <input
              type="number"
              className={styles.numberInput}
              value={position.height}
              onChange={(e) => handleNumberChange('height', e.target.value)}
              min={0}
              max={100}
              step={0.1}
            />
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldGroupLabel}>Typography</span>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Font Size</label>
          <input
            type="number"
            className={styles.numberInput}
            value={position.fontSize}
            onChange={(e) => handleNumberChange('fontSize', e.target.value)}
            min={1}
            max={100}
            step={0.5}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Font Family</label>
          <input
            type="text"
            className={styles.textInput}
            value={position.fontFamily || ''}
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            placeholder="Beleren2016, serif"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Color</label>
          <div className={styles.colorInputWrapper}>
            <input
              type="color"
              className={styles.colorPicker}
              value={position.color || '#000000'}
              onChange={(e) => handleChange('color', e.target.value)}
            />
            <input
              type="text"
              className={styles.textInput}
              value={position.color || '#000000'}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="#000000"
            />
          </div>
        </div>
      </div>

      {/* Alignment */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldGroupLabel}>Alignment</span>
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Horizontal</label>
            <select
              className={styles.select}
              value={position.align || 'left'}
              onChange={(e) =>
                handleChange('align', e.target.value as 'left' | 'center' | 'right')
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Vertical</label>
            <select
              className={styles.select}
              value={position.verticalAlign || 'top'}
              onChange={(e) =>
                handleChange('verticalAlign', e.target.value as 'top' | 'center' | 'bottom')
              }
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Icon (only for artist) */}
      {positionKey === 'artist' && (
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Icon URL</label>
          <input
            type="text"
            className={styles.textInput}
            value={position.icon || ''}
            onChange={(e) => handleChange('icon', e.target.value)}
            placeholder="/symbols/artist.svg"
          />
        </div>
      )}
    </div>
  );
}
