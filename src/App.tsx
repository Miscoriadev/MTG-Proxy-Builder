import { useState } from 'react';
import { useBorders, useBackgrounds, useSymbols } from './hooks';
import { CardBuilder } from './components/CardBuilder';
import { Header, ViewType } from './components/Header';
import { BorderEditor } from './components/BorderEditor';
import styles from './App.module.css';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('generator');

  const { borders, loading: bordersLoading, error: bordersError } = useBorders();
  const { backgrounds, loading: backgroundsLoading, error: backgroundsError } = useBackgrounds();
  const { symbols, loading: symbolsLoading, error: symbolsError } = useSymbols();

  const loading = bordersLoading || backgroundsLoading || symbolsLoading;
  const error = bordersError || backgroundsError || symbolsError;

  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.app}>
        <div className={styles.error}>
          <span>Failed to load data</span>
          <span className={styles.errorMessage}>{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Header currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'generator' ? (
        <CardBuilder
          borders={borders}
          backgrounds={backgrounds}
          symbols={symbols}
        />
      ) : (
        <BorderEditor
          borders={borders}
          backgrounds={backgrounds}
          symbols={symbols}
        />
      )}
    </div>
  );
}

export default App;
