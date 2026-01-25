import { useState, useEffect } from "react";
import styles from "./Controls.module.css";

interface MarginSelectorProps {
  selectedMargin: number;
  onMarginChange: (margin: number) => void;
  dpi: number;
}

const MIN_MARGIN = 0;
const MAX_MARGIN = 5;
const MM_PER_INCH = 25.4;

export function MarginSelector({
  selectedMargin,
  onMarginChange,
  dpi,
}: MarginSelectorProps) {
  // Local state for input field to allow typing
  const [inputValue, setInputValue] = useState(selectedMargin.toString());

  // Sync input with external value
  useEffect(() => {
    setInputValue(selectedMargin.toString());
  }, [selectedMargin]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onMarginChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let value = parseFloat(inputValue);
    if (isNaN(value)) value = 0;
    value = Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, value));
    // Round to 1 decimal place
    value = Math.round(value * 10) / 10;
    onMarginChange(value);
    setInputValue(value.toString());
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  // Calculate export dimensions
  const marginInches = selectedMargin / MM_PER_INCH;
  const exportWidth = Math.round((2.5 + 2 * marginInches) * dpi);
  const exportHeight = Math.round((3.5 + 2 * marginInches) * dpi);

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Print Margin</label>
      <div className={styles.sliderContainer}>
        <input
          type="range"
          className={styles.slider}
          min={MIN_MARGIN}
          max={MAX_MARGIN}
          step={0.1}
          value={selectedMargin}
          onChange={handleSliderChange}
        />
        <div className={styles.inputWithUnit}>
          <input
            type="text"
            className={styles.numberInput}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />
          <span className={styles.unit}>mm</span>
        </div>
      </div>
      <div className={styles.dimensionInfo}>
        Export: {exportWidth} x {exportHeight} px
      </div>
    </div>
  );
}
