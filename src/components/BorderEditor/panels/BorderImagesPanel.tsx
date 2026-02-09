import { useState, useRef, useCallback, useEffect } from 'react';
import { BorderColorImages, BorderImageValue, BorderImageVariants } from '../../../types';
import { useGoogleDrive } from '../../../hooks';
import { useSnackbar } from '../../Snackbar';
import { PanelTitleWithInfo } from '../../InfoDialog';
import styles from '../BorderEditor.module.css';
import infoStyles from '../../InfoDialog/InfoDialog.module.css';

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
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const {
    isSignedIn, isProcessing, scriptsLoaded, lastUploadedUrl,
    signIn, uploadAndShareFile, clearLastUrl,
  } = useGoogleDrive();
  const { showSnackbar } = useSnackbar();

  // Auto-close sign-in dialog once authenticated
  useEffect(() => {
    if (isSignedIn && showSignInDialog) setShowSignInDialog(false);
  }, [isSignedIn, showSignInDialog]);

  // Track which field should receive the uploaded URL
  const pendingCallbackRef = useRef<((url: string) => void) | null>(null);

  // When upload completes, deliver the URL to the pending field and show snackbar
  useEffect(() => {
    if (!lastUploadedUrl || !pendingCallbackRef.current) return;
    pendingCallbackRef.current(lastUploadedUrl);
    pendingCallbackRef.current = null;
    clearLastUrl();
    showSnackbar('Upload successful!');
  }, [lastUploadedUrl, clearLastUrl, showSnackbar]);

  const handleSimpleChange = (color: string, url: string) => {
    onChange({ ...images, [color]: url });
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

    onChange({ ...images, [color]: variants });
  };

  const toggleVariants = (color: string) => {
    const current = images[color];
    if (isVariants(current)) {
      onChange({ ...images, [color]: current.base });
    } else {
      onChange({
        ...images,
        [color]: { base: typeof current === 'string' ? current : '' },
      });
    }
  };

  const handleUpload = useCallback((file: File, onUrlReady: (url: string) => void, baseName?: string) => {
    pendingCallbackRef.current = onUrlReady;
    uploadAndShareFile(file, baseName);
  }, [uploadAndShareFile]);

  const requestSignIn = useCallback(() => {
    setShowSignInDialog(true);
  }, []);

  return (
    <div className={styles.panel}>
      <PanelTitleWithInfo
        title="Border Images"
        dialogTitle="Understanding Border Layers"
        dialogSubtitle="First the card art is drawn, then the base border is layered on top (the art shows through transparent pixels). For legendary cards, the legendary overlay is added next. For creatures, the power/toughness box is drawn. Finally, text is rendered on top of all layers."
      >
        <BorderImagesLayerInfo />
      </PanelTitleWithInfo>

      {showSignInDialog && (
        <SignInDialog
          scriptsLoaded={scriptsLoaded}
          onSignIn={signIn}
          onClose={() => setShowSignInDialog(false)}
        />
      )}

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
                      <ImageField
                        label="Base"
                        value={value.base}
                        onChange={(url) => handleVariantChange(color, 'base', url)}
                        placeholder="/borders/style/color.png"
                        uploadName={`${COLOR_LABELS[color].toLowerCase()}_base`}
                        isSignedIn={isSignedIn}
                        isUploading={isProcessing}
                        scriptsLoaded={scriptsLoaded}
                        onSignIn={requestSignIn}
                        onUpload={handleUpload}
                      />
                      <ImageField
                        label="Legendary"
                        value={value.legendary || ''}
                        onChange={(url) => handleVariantChange(color, 'legendary', url)}
                        placeholder="/borders/style/color_legendary.png"
                        uploadName={`${COLOR_LABELS[color].toLowerCase()}_legendary`}
                        isSignedIn={isSignedIn}
                        isUploading={isProcessing}
                        scriptsLoaded={scriptsLoaded}
                        onSignIn={requestSignIn}
                        onUpload={handleUpload}
                      />
                      <ImageField
                        label="Power/Toughness"
                        value={value.powerToughness || ''}
                        onChange={(url) => handleVariantChange(color, 'powerToughness', url)}
                        placeholder="/borders/style/color_pt.png"
                        uploadName={`${COLOR_LABELS[color].toLowerCase()}_pt`}
                        isSignedIn={isSignedIn}
                        isUploading={isProcessing}
                        scriptsLoaded={scriptsLoaded}
                        onSignIn={requestSignIn}
                        onUpload={handleUpload}
                      />
                    </>
                  ) : (
                    <ImageField
                      label="URL"
                      value={typeof value === 'string' ? value : ''}
                      onChange={(url) => handleSimpleChange(color, url)}
                      placeholder="/borders/style/color.png"
                      uploadName={COLOR_LABELS[color].toLowerCase()}
                      isSignedIn={isSignedIn}
                      isUploading={isProcessing}
                      scriptsLoaded={scriptsLoaded}
                      onSignIn={requestSignIn}
                      onUpload={handleUpload}
                    />
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

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder: string;
  uploadName: string;
  isSignedIn: boolean;
  isUploading: boolean;
  scriptsLoaded: boolean;
  onSignIn: () => void;
  onUpload: (file: File, onUrlReady: (url: string) => void, baseName?: string) => void;
}

function ImageField({
  label, value, onChange, placeholder, uploadName,
  isSignedIn, isUploading, scriptsLoaded, onSignIn, onUpload,
}: ImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file, onChange, uploadName);
    }
    e.target.value = '';
  }, [onUpload, onChange, uploadName]);

  const handleClick = useCallback(() => {
    if (!isSignedIn) {
      onSignIn();
      return;
    }
    fileInputRef.current?.click();
  }, [isSignedIn, onSignIn]);

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.inputWithUpload}>
        <input
          type="text"
          className={styles.textInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className={styles.uploadButton}
          onClick={handleClick}
          disabled={isUploading || !scriptsLoaded}
          title={!isSignedIn ? 'Sign in to Google Drive' : 'Upload with Google Drive'}
        >
          {isUploading ? <span className={styles.uploadSpinner} /> : '\u2191'}
        </button>
      </div>
    </div>
  );
}

interface SignInDialogProps {
  scriptsLoaded: boolean;
  onSignIn: () => void;
  onClose: () => void;
}

function SignInDialog({ scriptsLoaded, onSignIn, onClose }: SignInDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.signInBackdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.signInDialog}>
        <h3 className={styles.signInTitle}>Upload Images</h3>
        <p className={styles.signInSubtitle}>Host images via your Google Drive for use in the tool</p>
        <div className={styles.signInInfo}>
          We use Google Drive so this tool stays completely free for everyone.
          You upload to your own Drive, so you keep full control of your files.
          We only request permissions for files uploaded through this app.
        </div>
        <button
          className={styles.signInButton}
          onClick={onSignIn}
          disabled={!scriptsLoaded}
        >
          {scriptsLoaded ? 'Sign in with Google' : 'Loading...'}
        </button>
        <button className={styles.signInClose} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

const LAYER_INFO = [
  {
    num: 1,
    title: 'Background',
    desc: 'Card artwork (bottommost)',
    img: null,
  },
  {
    num: 2,
    title: 'Base Border',
    desc: 'Main border frame',
    img: '/borders/classic/blue.png',
  },
  {
    num: 3,
    title: 'Legendary',
    desc: 'For legendary cards',
    img: '/borders/classic/blue_legendary.png',
  },
  {
    num: 4,
    title: 'P/T Box',
    desc: 'For creature cards',
    img: '/borders/classic/blue_pt.png',
  },
  {
    num: 5,
    title: 'Text',
    desc: 'Name, cost, type, etc.',
    img: null,
  },
];

function BorderImagesLayerInfo() {
  return (
    <div className={infoStyles.layerList}>
      {LAYER_INFO.map((layer) => (
        <div key={layer.num} className={infoStyles.layerItem}>
          <span className={infoStyles.layerNumber}>{layer.num}</span>
          {layer.img ? (
            <img
              src={layer.img}
              alt={layer.title}
              className={infoStyles.layerImage}
              title="Click to view full size"
              onClick={() => window.open(layer.img!, '_blank')}
            />
          ) : (
            <div className={infoStyles.layerPlaceholder} />
          )}
          <div className={infoStyles.layerContent}>
            <div className={infoStyles.layerTitle}>{layer.title}</div>
            <div className={infoStyles.layerDescription}>{layer.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
