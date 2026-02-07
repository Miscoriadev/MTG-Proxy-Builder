import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { BorderConfig, BackgroundsData, SymbolsData, BorderTextPositions } from '../../types';
import { useBorderEditor } from '../../hooks';
import { CardSelector } from '../Controls';
import { CardCanvasHandle } from '../CardPreview';
import { EditorCanvas } from './EditorCanvas';
import {
  GeneralInfoPanel,
  ArtPositionPanel,
  BorderImagesPanel,
  TextPositionList,
  TextPositionSettings,
} from './panels';
import styles from './BorderEditor.module.css';

interface BorderEditorProps {
  borders: BorderConfig[];
  backgrounds: BackgroundsData;
  symbols: SymbolsData;
}

export function BorderEditor({ borders, backgrounds: _backgrounds, symbols }: BorderEditorProps) {
  const canvasRef = useRef<CardCanvasHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    editingConfig,
    selectedTextPositionKey,
    setSelectedTextPositionKey,
    previewCard,
    setPreviewCard,
    backgroundTransform,
    setBackgroundTransform,
    updateGeneralInfo,
    updateTextPosition,
    updateBorderImages,
    updateArtPosition,
    exportAsJson,
    importFromJson,
    loadFromExisting,
    createNew,
    customBorders,
    hasActiveConfig,
    deleteCustomBorder,
  } = useBorderEditor(borders);

  // Canvas scale mode state
  const [canvasScaleMode, setCanvasScaleMode] = useState<'actual' | 'fill'>('actual');
  const previewSectionRef = useRef<HTMLDivElement>(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Canvas dimensions
  const CANVAS_WIDTH = 360;
  const CANVAS_HEIGHT = 504;

  // Update window height on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate scale based on mode
  const canvasScale = useMemo(() => {
    if (canvasScaleMode === 'fill') {
      const padding = 200; // Account for header, controls row, and margins
      return Math.min((windowHeight - padding) / CANVAS_HEIGHT, 2);
    }
    return 1;
  }, [canvasScaleMode, windowHeight]);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFromJson(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = useCallback(() => {
    const confirmed = window.confirm(
      'This border configuration will be permanently removed from your local storage.\n\n' +
      'If you want to keep it, download the JSON file first.\n\n' +
      'Are you sure you want to delete this border?'
    );

    if (confirmed) {
      deleteCustomBorder(editingConfig.id);
    }
  }, [editingConfig.id, deleteCustomBorder]);

  const selectedPosition = selectedTextPositionKey
    ? editingConfig.textPositions[selectedTextPositionKey as keyof BorderTextPositions]
    : null;

  // Get background URL for preview
  const backgroundUrl = previewCard?.image_uris?.art_crop || null;

  return (
    <div className={styles.container}>
      <div className={styles.previewSection} ref={previewSectionRef}>
        {hasActiveConfig ? (
          previewCard ? (
            <div
              className={styles.scaledCanvasContainer}
              style={{
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top center',
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
              }}
            >
              <EditorCanvas
              ref={canvasRef}
              card={previewCard}
              border={editingConfig}
              backgroundUrl={backgroundUrl}
              backgroundTransform={backgroundTransform}
              onBackgroundTransformChange={setBackgroundTransform}
              symbolsData={symbols}
              selectedTextPositionKey={selectedTextPositionKey}
              onTextPositionChange={updateTextPosition}
            />
            </div>
          ) : (
            <div className={styles.placeholder}>
              Select a card to preview
              <br />
              <span className={styles.subtext}>Use the card selector below</span>
            </div>
          )
        ) : (
          <div className={styles.placeholder}>
            Create or load a border to begin editing
            <br />
            <span className={styles.subtext}>Use the selection panel on the right</span>
          </div>
        )}
        {hasActiveConfig && (
          <div
            className={styles.canvasControlsRow}
            style={{ marginTop: `${(canvasScale - 1) * CANVAS_HEIGHT + 16}px` }}
          >
            <CardSelector selectedCard={previewCard} onSelect={setPreviewCard} />
            <select
              className={styles.scaleSelect}
              value={canvasScaleMode}
              onChange={(e) => setCanvasScaleMode(e.target.value as 'actual' | 'fill')}
            >
              <option value="actual">Actual size</option>
              <option value="fill">Fill</option>
            </select>
          </div>
        )}
      </div>

      <div className={styles.controlsSection}>
        <div className={styles.controlPanel}>
          <h2 className={styles.sectionTitle}>Border Editor</h2>

          {/* Selection panel */}
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Selection</h3>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Edit existing</label>
              <select
                className={styles.select}
                value={hasActiveConfig ? editingConfig.id : ''}
                onChange={(e) => {
                  const border = customBorders.find((b) => b.id === e.target.value);
                  if (border) loadFromExisting(border);
                }}
                disabled={customBorders.length === 0}
              >
                <option value="" disabled>
                  {customBorders.length === 0 ? 'No custom borders' : 'Select a border...'}
                </option>
                {customBorders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.actionButtons}>
              <button className={styles.actionButton} onClick={createNew}>
                Create New
              </button>
              <button
                className={styles.actionButton}
                onClick={() => fileInputRef.current?.click()}
              >
                Load JSON
              </button>
              <button
                className={styles.actionButton}
                onClick={exportAsJson}
                disabled={!hasActiveConfig}
              >
                Download JSON
              </button>
              {hasActiveConfig && (
                <button
                  className={`${styles.actionButton} ${styles.danger}`}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {hasActiveConfig && (
            <>
              <GeneralInfoPanel
                name={editingConfig.name}
                description={editingConfig.description}
                onChange={updateGeneralInfo}
              />

              <ArtPositionPanel
                artPosition={editingConfig.art}
                onChange={updateArtPosition}
              />

              <BorderImagesPanel
                images={editingConfig.images}
                onChange={updateBorderImages}
              />

              <TextPositionList
                textPositions={editingConfig.textPositions}
                selectedKey={selectedTextPositionKey}
                onSelect={setSelectedTextPositionKey}
              />

              {selectedPosition && selectedTextPositionKey && (
                <TextPositionSettings
                  positionKey={selectedTextPositionKey}
                  position={selectedPosition}
                  onChange={(pos) => updateTextPosition(selectedTextPositionKey, pos)}
                />
              )}
            </>
          )}

          {/* Hidden file input for JSON import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>
      </div>
    </div>
  );
}
