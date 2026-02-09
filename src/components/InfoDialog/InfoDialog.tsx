import { useState, useEffect, ReactNode } from 'react';
import styles from './InfoDialog.module.css';

interface InfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function InfoDialog({ isOpen, onClose, title, subtitle, children }: InfoDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.dialog}>
        <h3 className={styles.dialogTitle}>{title}</h3>
        {subtitle && <p className={styles.dialogSubtitle}>{subtitle}</p>}
        <div className={styles.dialogContent}>{children}</div>
        <button className={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

interface PanelTitleWithInfoProps {
  title: string;
  dialogTitle: string;
  dialogSubtitle?: string;
  children: ReactNode;
}

export function PanelTitleWithInfo({
  title,
  dialogTitle,
  dialogSubtitle,
  children,
}: PanelTitleWithInfoProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div className={styles.titleWrapper}>
        <h3 className={styles.title}>{title}</h3>
        <button
          className={styles.infoButton}
          onClick={() => setShowDialog(true)}
          title="More information"
          aria-label={`Information about ${title}`}
        >
          {'\u24D8'}
        </button>
      </div>
      <InfoDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={dialogTitle}
        subtitle={dialogSubtitle}
      >
        {children}
      </InfoDialog>
    </>
  );
}
