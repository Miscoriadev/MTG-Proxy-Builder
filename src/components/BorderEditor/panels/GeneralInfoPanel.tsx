import styles from '../BorderEditor.module.css';

interface GeneralInfoPanelProps {
  name: string;
  description?: string;
  onChange: (updates: { name?: string; description?: string }) => void;
}

export function GeneralInfoPanel({ name, description, onChange }: GeneralInfoPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>General Info</h3>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Name</label>
        <input
          type="text"
          className={styles.textInput}
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Border Name"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.fieldLabel}>Description</label>
        <textarea
          className={styles.textArea}
          value={description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description..."
          rows={2}
        />
      </div>
    </div>
  );
}
