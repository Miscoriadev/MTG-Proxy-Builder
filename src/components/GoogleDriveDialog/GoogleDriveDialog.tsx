import { useEffect, useCallback, useRef } from 'react';
import { useGoogleDrive } from '../../hooks';
import { useSnackbar } from '../Snackbar';
import styles from './GoogleDriveDialog.module.css';

interface GoogleDriveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlReady?: (url: string) => void;
}

export function GoogleDriveDialog({ isOpen, onClose, onUrlReady }: GoogleDriveDialogProps) {
  const {
    scriptsLoaded,
    isSignedIn,
    isProcessing,
    lastUploadedUrl,
    error,
    signIn,
    signOut,
    uploadAndShareFile,
    clearError,
    clearLastUrl,
  } = useGoogleDrive();

  const { showSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const onUrlReadyRef = useRef(onUrlReady);
  onUrlReadyRef.current = onUrlReady;

  const hasConfig = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // When upload completes: call onUrlReady, show snackbar, close dialog
  useEffect(() => {
    if (!lastUploadedUrl) return;
    onUrlReadyRef.current?.(lastUploadedUrl);
    clearLastUrl();
    onClose();
    showSnackbar('Upload successful!');
  }, [lastUploadedUrl, clearLastUrl, onClose, showSnackbar]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAndShareFile(file);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, [uploadAndShareFile]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog}>
        <h2 className={styles.title}>Upload Images</h2>
        <p className={styles.subtitle}>Host images via your Google Drive for use in the tool</p>

        <div className={styles.infoBox}>
          We use Google Drive so this tool stays completely free for everyone.
          You upload to your own Drive, so you keep full control of your files.
          We only request permissions for files uploaded through this app.
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {!hasConfig && (
          <div className={styles.configWarning}>
            Google API not configured. Set <code>VITE_GOOGLE_CLIENT_ID</code> in your .env.local file.
          </div>
        )}

        {hasConfig && (
          <>
            {error && (
              <div className={styles.errorMessage} onClick={clearError}>
                {error}
              </div>
            )}

            {isProcessing && (
              <div className={styles.spinner}>
                <div className={styles.spinnerIcon} />
                Uploading and sharing file...
              </div>
            )}

            {!isProcessing && !isSignedIn && (
              <div className={styles.actions}>
                <button
                  className={styles.actionButton}
                  onClick={signIn}
                  disabled={!scriptsLoaded}
                >
                  {scriptsLoaded ? 'Sign in with Google' : 'Loading...'}
                </button>
              </div>
            )}

            {!isProcessing && isSignedIn && (
              <div className={styles.actions}>
                <button className={styles.actionButton} onClick={handleUploadClick}>
                  Choose Image to Upload
                </button>
              </div>
            )}

            {isSignedIn && (
              <div className={styles.footer}>
                <button className={styles.signOutLink} onClick={signOut}>
                  Sign out
                </button>
                <button className={styles.closeButton} onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </>
        )}

        {(!hasConfig || !isSignedIn) && (
          <div className={styles.footer}>
            <span />
            <button className={styles.closeButton} onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
