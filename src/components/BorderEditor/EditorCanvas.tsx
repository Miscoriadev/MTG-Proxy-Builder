import { forwardRef } from 'react';
import { ScryfallCard, BorderConfig, TextPosition, BorderTextPositions, SymbolsData } from '../../types';
import { BackgroundTransform } from '../../hooks/useCardBuilder';
import { CardCanvas, CardCanvasHandle } from '../CardPreview';
import { TextboxOverlay } from './TextboxOverlay';
import styles from './BorderEditor.module.css';

interface EditorCanvasProps {
  card: ScryfallCard;
  border: BorderConfig;
  backgroundUrl: string | null;
  backgroundTransform: BackgroundTransform;
  onBackgroundTransformChange: (transform: BackgroundTransform) => void;
  symbolsData: SymbolsData;
  selectedTextPositionKey: string | null;
  onTextPositionChange: (key: string, position: TextPosition) => void;
}

// Display canvas size (matches CardCanvas default)
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 504;

export const EditorCanvas = forwardRef<CardCanvasHandle, EditorCanvasProps>(
  function EditorCanvas(
    {
      card,
      border,
      backgroundUrl,
      backgroundTransform,
      onBackgroundTransformChange,
      symbolsData,
      selectedTextPositionKey,
      onTextPositionChange,
    },
    ref
  ) {
    // Get the selected position if any
    const selectedPosition = selectedTextPositionKey
      ? border.textPositions[selectedTextPositionKey as keyof BorderTextPositions]
      : null;

    return (
      <div className={styles.canvasWrapper}>
        <CardCanvas
          ref={ref}
          card={card}
          border={border}
          backgroundUrl={backgroundUrl}
          backgroundTransform={backgroundTransform}
          onBackgroundTransformChange={onBackgroundTransformChange}
          dpi={300}
          symbolsData={symbolsData}
          debug={false}
        />

        {/* Only render overlay for the selected text position */}
        {selectedTextPositionKey && selectedPosition && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <TextboxOverlay
                position={selectedPosition}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                onChange={(newPos) => onTextPositionChange(selectedTextPositionKey, newPos)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);
