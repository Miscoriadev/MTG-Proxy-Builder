import { useCards, useBorders, useBackgrounds } from './hooks';
import { CardBuilder } from './components/CardBuilder';
import styles from './App.module.css';

function App() {
  const { cards, loading: cardsLoading, error: cardsError } = useCards();
  const { borders, loading: bordersLoading, error: bordersError } = useBorders();
  const { backgrounds, loading: backgroundsLoading, error: backgroundsError } = useBackgrounds();

  const loading = cardsLoading || bordersLoading || backgroundsLoading;
  const error = cardsError || bordersError || backgroundsError;

  if (loading) {
    return (
      <div className={styles.app}>
        <div className={styles.loading}>Loading card data...</div>
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
        cards={cards}
        borders={borders}
        backgrounds={backgrounds}
      />
    </div>
  );
}

export default App;
