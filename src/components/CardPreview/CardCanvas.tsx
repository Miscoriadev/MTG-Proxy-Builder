import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ScryfallCard, BorderConfig, SymbolsData } from '../../types';
import { renderCard, getCanvasDimensions, downloadPng } from '../../utils/canvasRenderer';
import styles from './CardPreview.module.css';

export interface CardCanvasHandle {
  download: () => void;
}

interface CardCanvasProps {
  card: ScryfallCard;
  border: BorderConfig;
  backgroundUrl: string | null;
  dpi: number;
  symbolsData?: SymbolsData;
}

export const CardCanvas = forwardRef<CardCanvasHandle, CardCanvasProps>(
  function CardCanvas({ card, border, backgroundUrl, dpi, symbolsData }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderLockRef = useRef<Promise<void>>(Promise.resolve());
    const renderIdRef = useRef(0);
    const { width, height } = getCanvasDimensions(dpi);

    // Expose download function via ref
    useImperativeHandle(ref, () => ({
      download: () => {
        if (canvasRef.current) {
          const filename = card.name.replace(/[^a-zA-Z0-9]/g, '_');
          downloadPng(canvasRef.current, filename);
        }
      },
    }));

    // Re-render canvas when dependencies change
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Increment render ID to track which render is current
      renderIdRef.current += 1;
      const thisRenderId = renderIdRef.current;

      const render = async () => {
        // Wait for any previous render to complete
        await renderLockRef.current;

        // Check if this render is still the current one
        if (thisRenderId !== renderIdRef.current) {
          return; // A newer render has been scheduled, skip this one
        }

        let resolveRender: () => void;
        renderLockRef.current = new Promise((resolve) => {
          resolveRender = resolve;
        });

        try {
          await renderCard(canvas, {
            card,
            border,
            backgroundUrl,
            dpi,
            symbolsData,
          });
        } catch (error) {
          console.error('Failed to render card:', error);
        } finally {
          resolveRender!();
        }
      };

      render();
    }, [card, border, backgroundUrl, dpi, symbolsData]);

    // Calculate display size (double the base screen size for better preview)
    const displayWidth = 360; // 2.5 inches at 144 DPI
    const displayHeight = 504; // 3.5 inches at 144 DPI

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.canvas}
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      />
    );
  }
);
