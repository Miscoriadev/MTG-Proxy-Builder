import styles from './Header.module.css';

export type ViewType = 'generator' | 'editor';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>MTG Card Builder</h1>
      <nav className={styles.nav}>
        <button
          className={`${styles.navButton} ${currentView === 'generator' ? styles.active : ''}`}
          onClick={() => onViewChange('generator')}
        >
          Generator
        </button>
        <button
          className={`${styles.navButton} ${currentView === 'editor' ? styles.active : ''}`}
          onClick={() => onViewChange('editor')}
        >
          Border Editor
        </button>
      </nav>
    </header>
  );
}
