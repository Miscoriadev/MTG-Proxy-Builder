import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from './Snackbar.module.css';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextValue {
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useSnackbar must be used within SnackbarProvider');
  return ctx;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<SnackbarType>('success');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const keyRef = useRef(0);

  const showSnackbar = useCallback((msg: string, snackType: SnackbarType = 'success') => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    // Bump key to restart CSS animation if already visible
    keyRef.current += 1;
    setMessage(msg);
    setType(snackType);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {visible && (
        <div
          key={keyRef.current}
          className={`${styles.snackbar} ${styles[type]}`}
        >
          {message}
        </div>
      )}
    </SnackbarContext.Provider>
  );
}
