import { useState } from 'react';
import { BorderColorImages, BorderImageValue, BorderImageVariants } from '../../../types';
import styles from '../BorderEditor.module.css';

interface BorderImagesPanelProps {
  images: BorderColorImages;
  onChange: (images: BorderColorImages) => void;
}

const COLOR_LABELS: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
  C: 'Colorless',
  M: 'Multicolor',
};

const COLORS = ['W', 'U', 'B', 'R', 'G', 'C', 'M'] as const;

function isVariants(value: BorderImageValue | undefined): value is BorderImageVariants {
  return typeof value === 'object' && value !== null && 'base' in value;
}

export function BorderImagesPanel({ images, onChange }: BorderImagesPanelProps) {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  const handleSimpleChange = (color: string, url: string) => {
    onChange({
      ...images,
      [color]: url,
    });
  };

  const handleVariantChange = (
    color: string,
    variant: 'base' | 'legendary' | 'powerToughness',
    url: string
  ) => {
    const current = images[color];
    const variants: BorderImageVariants = isVariants(current)
      ? { ...current }
      : { base: typeof current === 'string' ? current : '' };

    if (variant === 'base') {
      variants.base = url;
    } else {
      variants[variant] = url || undefined;
    }

    onChange({
      ...images,
      [color]: variants,
    });
  };

  const toggleVariants = (color: string) => {
    const current = images[color];
    if (isVariants(current)) {
      // Convert to simple string
      onChange({
        ...images,
        [color]: current.base,
      });
    } else {
      // Convert to variants
      onChange({
        ...images,
        [color]: {
          base: typeof current === 'string' ? current : '',
        },
      });
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Border Images</h3>
      <div className={styles.colorList}>
        {COLORS.map((color) => {
          const value = images[color];
          const hasVariants = isVariants(value);
          const isExpanded = expandedColor === color;

          return (
            <div key={color} className={styles.colorItem}>
              <div
                className={styles.colorHeader}
                onClick={() => setExpandedColor(isExpanded ? null : color)}
              >
                <span className={styles.colorLabel}>{COLOR_LABELS[color]}</span>
                <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
              </div>

              {isExpanded && (
                <div className={styles.colorContent}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasVariants}
                      onChange={() => toggleVariants(color)}
                    />
                    Use variants (legendary, P/T)
                  </label>

                  {hasVariants ? (
                    <>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Base</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          value={value.base}
                          onChange={(e) => handleVariantChange(color, 'base', e.target.value)}
                          placeholder="/borders/style/color.png"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Legendary</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          value={value.legendary || ''}
                          onChange={(e) => handleVariantChange(color, 'legendary', e.target.value)}
                          placeholder="/borders/style/color_legendary.png"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Power/Toughness</label>
                        <input
                          type="text"
                          className={styles.textInput}
                          value={value.powerToughness || ''}
                          onChange={(e) =>
                            handleVariantChange(color, 'powerToughness', e.target.value)
                          }
                          placeholder="/borders/style/color_pt.png"
                        />
                      </div>
                    </>
                  ) : (
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>URL</label>
                      <input
                        type="text"
                        className={styles.textInput}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(e) => handleSimpleChange(color, e.target.value)}
                        placeholder="/borders/style/color.png"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
