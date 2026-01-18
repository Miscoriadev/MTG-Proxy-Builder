import { useBorders, useBackgrounds, useSymbols } from './hooks';
import { CardBuilder } from './components/CardBuilder';
import styles from './App.module.css';

function App() {
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
      <header className={styles.header}>
        <h1 className={styles.title}>MTG Card Builder</h1>
      </header>
      <CardBuilder
        borders={borders}
        backgrounds={backgrounds}
        symbols={symbols}
      />
    </div>
  );
}

export default App;
