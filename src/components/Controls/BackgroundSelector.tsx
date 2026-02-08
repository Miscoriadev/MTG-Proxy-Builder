import { useState, useRef, useCallback, useEffect } from 'react';
import { BackgroundImage } from '../../types';
import { useGoogleDrive } from '../../hooks';
import { useSnackbar } from '../Snackbar';
import { proxyImageUrl } from '../../utils/imageProxy';
import styles from './Controls.module.css';

interface BackgroundSelectorProps {
  backgrounds: BackgroundImage[];
  selectedBackground: BackgroundImage | null;
  onSelect: (background: BackgroundImage) => void;
  onUploadComplete?: (url: string) => void;
  hasCard?: boolean;
}

export function BackgroundSelector({
  backgrounds, selectedBackground, onSelect, onUploadComplete, hasCard,
}: BackgroundSelectorProps) {
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const {
    isSignedIn, isProcessing, scriptsLoaded, lastUploadedUrl,
    signIn, uploadAndShareFile, clearLastUrl,
  } = useGoogleDrive();
  const { showSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-close sign-in dialog once authenticated
  useEffect(() => {
    if (isSignedIn && showSignInDialog) setShowSignInDialog(false);
  }, [isSignedIn, showSignInDialog]);

  // When upload completes, notify parent and show snackbar
  useEffect(() => {
    if (!lastUploadedUrl) return;
    onUploadComplete?.(lastUploadedUrl);
    clearLastUrl();
    showSnackbar('Background uploaded!');
  }, [lastUploadedUrl, clearLastUrl, onUploadComplete, showSnackbar]);

  const handleUploadClick = useCallback(() => {
    if (!isSignedIn) {
      setShowSignInDialog(true);
      return;
    }
    fileInputRef.current?.click();
  }, [isSignedIn]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndShareFile(file, 'background');
    }
    e.target.value = '';
  }, [uploadAndShareFile]);

  if (!hasCard) {
    return (
      <div className={styles.controlGroup}>
        <label className={styles.label}>Background</label>
        <div className={styles.noBackgrounds}>
          Select a card to see available backgrounds
        </div>
      </div>
    );
  }

  return (
    <div className={styles.controlGroup}>
      <label className={styles.label}>Background</label>

      {showSignInDialog && (
        <SignInDialog
          scriptsLoaded={scriptsLoaded}
          onSignIn={signIn}
          onClose={() => setShowSignInDialog(false)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className={styles.thumbnailGrid}>
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`${styles.thumbnail} ${selectedBackground?.url === bg.url ? styles.selected : ''}`}
            onClick={() => onSelect(bg)}
            title={bg.label || `Background ${index + 1}`}
          >
            <img
              src={proxyImageUrl(bg.url)}
              alt={bg.label || `Background ${index + 1}`}
              className={styles.thumbnailImage}
              loading="lazy"
            />
          </div>
        ))}
        <div
          className={`${styles.thumbnail} ${styles.uploadThumbnail}`}
          onClick={handleUploadClick}
          title={!isSignedIn ? 'Sign in to Google Drive' : 'Upload background image'}
        >
          {isProcessing ? (
            <span className={styles.uploadThumbnailSpinner} />
          ) : (
            <span className={styles.uploadThumbnailIcon}>+</span>
          )}
        </div>
      </div>
      <div className={styles.hint}>
        Drag to pan • Shift+scroll to zoom
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
