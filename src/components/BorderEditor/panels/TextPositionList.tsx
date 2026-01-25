import { BorderTextPositions } from '../../../types';
import styles from '../BorderEditor.module.css';

interface TextPositionListProps {
  textPositions: BorderTextPositions;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

// Note: flavorText is excluded because it shares the same space as oracleText
const POSITION_ORDER = [
  'name',
  'manaCost',
  'typeLine',
  'oracleText',
  'powerToughness',
  'loyalty',
  'artist',
  'copyright',
] as const;

const POSITION_LABELS: Record<string, string> = {
  name: 'Card Name',
  manaCost: 'Mana Cost',
  typeLine: 'Type Line',
  oracleText: 'Oracle Text',
  powerToughness: 'Power/Toughness',
  loyalty: 'Loyalty',
  artist: 'Artist',
  copyright: 'Copyright',
};

export function TextPositionList({ textPositions, selectedKey, onSelect }: TextPositionListProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Text Positions</h3>
      <div className={styles.positionList}>
        {POSITION_ORDER.map((key) => {
          const position = textPositions[key as keyof BorderTextPositions];
          const isSelected = selectedKey === key;
          const exists = position !== undefined;

          return (
            <button
              key={key}
              className={`${styles.positionItem} ${isSelected ? styles.selected : ''} ${!exists ? styles.disabled : ''}`}
              onClick={() => exists && onSelect(key)}
              disabled={!exists}
            >
              <span className={styles.positionLabel}>{POSITION_LABELS[key]}</span>
              {exists && (
                <span className={styles.positionInfo}>
                  {Math.round(position.x)}%, {Math.round(position.y)}%
                </span>
              )}
              {!exists && <span className={styles.positionInfo}>Not defined</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
