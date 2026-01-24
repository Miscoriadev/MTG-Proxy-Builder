import {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";
import { ScryfallCard, BorderConfig, SymbolsData } from "../../types";
import {
  renderCard,
  getCanvasDimensions,
  exportPng,
  BackgroundTransform,
} from "../../utils/canvasRenderer";
import styles from "./CardPreview.module.css";

export interface CardCanvasHandle {
  download: (marginMm?: number) => void;
}

interface CardCanvasProps {
  card: ScryfallCard;
  border: BorderConfig;
  backgroundUrl: string | null;
  backgroundTransform?: BackgroundTransform;
  onBackgroundTransformChange?: (transform: BackgroundTransform) => void;
  dpi: number;
  symbolsData?: SymbolsData;
}

export const CardCanvas = forwardRef<CardCanvasHandle, CardCanvasProps>(
  function CardCanvas(
    {
      card,
      border,
      backgroundUrl,
      backgroundTransform,
      onBackgroundTransformChange,
      dpi,
      symbolsData,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderLockRef = useRef<Promise<void>>(Promise.resolve());
    const renderIdRef = useRef(0);
    // Store the full offscreen canvas (with margin) for export
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const { cardWidth, cardHeight } = getCanvasDimensions(dpi);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // Expose download function via ref
    useImperativeHandle(ref, () => ({
      download: (marginMm: number = 0) => {
        if (offscreenCanvasRef.current) {
          const filename = card.name.replace(/[^a-zA-Z0-9]/g, "_");
          exportPng(offscreenCanvasRef.current, filename, dpi, marginMm);
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
          const offscreenCanvas = await renderCard(canvas, {
            card,
            border,
            backgroundUrl,
            backgroundTransform,
            dpi,
            symbolsData,
          });
          // Store the offscreen canvas for export
          offscreenCanvasRef.current = offscreenCanvas;
        } catch (error) {
          console.error("Failed to render card:", error);
        } finally {
          resolveRender!();
        }
      };

      render();
    }, [card, border, backgroundUrl, backgroundTransform, dpi, symbolsData]);

    // Calculate display size (double the base screen size for better preview)
    const displayWidth = 360; // 2.5 inches at 144 DPI
    const displayHeight = 504; // 3.5 inches at 144 DPI

    // Mouse wheel for scaling (Shift+scroll)
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        if (!e.shiftKey || !onBackgroundTransformChange || !backgroundTransform)
          return;
        e.preventDefault();

        const scaleDelta = e.deltaY > 0 ? 0.95 : 1.05;
        const newScale = Math.max(
          0.1,
          Math.min(10, backgroundTransform.scale * scaleDelta),
        );

        onBackgroundTransformChange({
          ...backgroundTransform,
          scale: newScale,
        });
      },
      [backgroundTransform, onBackgroundTransformChange],
    );

    // Mouse down to start drag
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (!onBackgroundTransformChange) return;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      },
      [onBackgroundTransformChange],
    );

    // Mouse move for dragging
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (!isDragging || !onBackgroundTransformChange || !backgroundTransform)
          return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Calculate delta as percentage of canvas dimensions
        const rect = canvas.getBoundingClientRect();
        const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

        onBackgroundTransformChange({
          ...backgroundTransform,
          offsetX: backgroundTransform.offsetX + deltaX,
          offsetY: backgroundTransform.offsetY + deltaY,
        });

        dragStartRef.current = { x: e.clientX, y: e.clientY };
      },
      [isDragging, backgroundTransform, onBackgroundTransformChange],
    );

    // Mouse up to stop drag
    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={cardWidth}
        height={cardHeight}
        className={styles.canvas}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: displayWidth,
          height: displayHeight,
          cursor: onBackgroundTransformChange
            ? isDragging
              ? "grabbing"
              : "grab"
            : "default",
        }}
      />
    );
  },
);
