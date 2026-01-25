import { useState, useCallback, useEffect } from 'react';
import { TextPosition } from '../../types';
import styles from './TextboxOverlay.module.css';

interface TextboxOverlayProps {
  position: TextPosition;
  canvasWidth: number;
  canvasHeight: number;
  onChange: (position: TextPosition) => void;
}

type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w';

interface DragState {
  action: 'move' | ResizeHandle;
  startX: number;
  startY: number;
  startPosition: TextPosition;
}

// Canvas dimensions (in inches)
const CARD_WIDTH_INCHES = 2.5;
const CARD_HEIGHT_INCHES = 3.5;
const MARGIN_MM = 5;
const MM_PER_INCH = 25.4;
const MARGIN_INCHES = MARGIN_MM / MM_PER_INCH;
const FULL_WIDTH_INCHES = CARD_WIDTH_INCHES + 2 * MARGIN_INCHES;
const FULL_HEIGHT_INCHES = CARD_HEIGHT_INCHES + 2 * MARGIN_INCHES;

// Convert full canvas percentage to card-relative pixels
// Text positions are percentages of the FULL canvas (with margin)
// Display canvas shows only the CARD portion (no margin)
const fullPercentToCardPixels = (
  fullPercent: number,
  fullInches: number,
  marginInches: number,
  cardInches: number,
  displayPixels: number
) => {
  const fullPositionInches = (fullPercent / 100) * fullInches;
  const cardPositionInches = fullPositionInches - marginInches;
  const cardPercent = (cardPositionInches / cardInches) * 100;
  return (cardPercent / 100) * displayPixels;
};

// Convert full canvas percentage width/height to card-relative pixels
const fullPercentSizeToCardPixels = (
  fullPercent: number,
  fullInches: number,
  cardInches: number,
  displayPixels: number
) => {
  const sizeInches = (fullPercent / 100) * fullInches;
  const cardPercent = (sizeInches / cardInches) * 100;
  return (cardPercent / 100) * displayPixels;
};

// Convert card-relative pixel size back to full canvas percentage
const cardPixelsSizeToFullPercent = (
  cardPixels: number,
  displayPixels: number,
  cardInches: number,
  fullInches: number
) => {
  const cardPercent = (cardPixels / displayPixels) * 100;
  const sizeInches = (cardPercent / 100) * cardInches;
  return (sizeInches / fullInches) * 100;
};

// Round to 1 decimal place
const round = (value: number) => Math.round(value * 10) / 10;

// Clamp value between min and max
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function TextboxOverlay({
  position,
  canvasWidth,
  canvasHeight,
  onChange,
}: TextboxOverlayProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Calculate pixel positions - convert from full canvas % to card-relative pixels
  const left = fullPercentToCardPixels(position.x, FULL_WIDTH_INCHES, MARGIN_INCHES, CARD_WIDTH_INCHES, canvasWidth);
  const top = fullPercentToCardPixels(position.y, FULL_HEIGHT_INCHES, MARGIN_INCHES, CARD_HEIGHT_INCHES, canvasHeight);
  const width = fullPercentSizeToCardPixels(position.width, FULL_WIDTH_INCHES, CARD_WIDTH_INCHES, canvasWidth);
  const height = fullPercentSizeToCardPixels(position.height, FULL_HEIGHT_INCHES, CARD_HEIGHT_INCHES, canvasHeight);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, action: 'move' | ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      setDragState({
        action,
        startX: e.clientX,
        startY: e.clientY,
        startPosition: { ...position },
      });
    },
    [position]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      // Convert pixel delta to full canvas percentage delta
      // Card pixel delta -> card % -> full canvas inches -> full canvas %
      const deltaXFullPercent = cardPixelsSizeToFullPercent(deltaX, canvasWidth, CARD_WIDTH_INCHES, FULL_WIDTH_INCHES);
      const deltaYFullPercent = cardPixelsSizeToFullPercent(deltaY, canvasHeight, CARD_HEIGHT_INCHES, FULL_HEIGHT_INCHES);

      const { startPosition, action } = dragState;
      let newX = startPosition.x;
      let newY = startPosition.y;
      let newWidth = startPosition.width;
      let newHeight = startPosition.height;

      if (action === 'move') {
        newX = clamp(round(startPosition.x + deltaXFullPercent), 0, 100 - startPosition.width);
        newY = clamp(round(startPosition.y + deltaYFullPercent), 0, 100 - startPosition.height);
      } else {
        // Handle resize based on which handle is being dragged
        switch (action) {
          case 'nw':
            newX = clamp(round(startPosition.x + deltaXFullPercent), 0, startPosition.x + startPosition.width - 1);
            newY = clamp(round(startPosition.y + deltaYFullPercent), 0, startPosition.y + startPosition.height - 1);
            newWidth = round(startPosition.width - (newX - startPosition.x));
            newHeight = round(startPosition.height - (newY - startPosition.y));
            break;
          case 'n':
            newY = clamp(round(startPosition.y + deltaYFullPercent), 0, startPosition.y + startPosition.height - 1);
            newHeight = round(startPosition.height - (newY - startPosition.y));
            break;
          case 'ne':
            newY = clamp(round(startPosition.y + deltaYFullPercent), 0, startPosition.y + startPosition.height - 1);
            newWidth = clamp(round(startPosition.width + deltaXFullPercent), 1, 100 - startPosition.x);
            newHeight = round(startPosition.height - (newY - startPosition.y));
            break;
          case 'e':
            newWidth = clamp(round(startPosition.width + deltaXFullPercent), 1, 100 - startPosition.x);
            break;
          case 'se':
            newWidth = clamp(round(startPosition.width + deltaXFullPercent), 1, 100 - startPosition.x);
            newHeight = clamp(round(startPosition.height + deltaYFullPercent), 1, 100 - startPosition.y);
            break;
          case 's':
            newHeight = clamp(round(startPosition.height + deltaYFullPercent), 1, 100 - startPosition.y);
            break;
          case 'sw':
            newX = clamp(round(startPosition.x + deltaXFullPercent), 0, startPosition.x + startPosition.width - 1);
            newWidth = round(startPosition.width - (newX - startPosition.x));
            newHeight = clamp(round(startPosition.height + deltaYFullPercent), 1, 100 - startPosition.y);
            break;
          case 'w':
            newX = clamp(round(startPosition.x + deltaXFullPercent), 0, startPosition.x + startPosition.width - 1);
            newWidth = round(startPosition.width - (newX - startPosition.x));
            break;
        }
      }

      onChange({
        ...position,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, canvasWidth, canvasHeight, position, onChange]);

  return (
    <div
      className={`${styles.overlay} ${styles.selected} ${dragState ? styles.dragging : ''}`}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Resize handles */}
      <div
        className={`${styles.handle} ${styles.nw}`}
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className={`${styles.handle} ${styles.n}`}
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div
        className={`${styles.handle} ${styles.ne}`}
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className={`${styles.handle} ${styles.e}`}
        onMouseDown={(e) => handleMouseDown(e, 'e')}
      />
      <div
        className={`${styles.handle} ${styles.se}`}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />
      <div
        className={`${styles.handle} ${styles.s}`}
        onMouseDown={(e) => handleMouseDown(e, 's')}
      />
      <div
        className={`${styles.handle} ${styles.sw}`}
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className={`${styles.handle} ${styles.w}`}
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
    </div>
  );
}
