interface PersistencePanelProps {
  payload: string;
  statusMessage: string;
  onLoadJournalScenario: () => void;
  onSavePayload: () => void;
  onRestorePayload: () => void;
  onCopyPayload: () => void;
  onPayloadChange: (value: string) => void;
}

export function PersistencePanel({
  payload,
  statusMessage,
  onLoadJournalScenario,
  onSavePayload,
  onRestorePayload,
  onCopyPayload,
  onPayloadChange,
}: PersistencePanelProps) {
  return (
    <section className="feature-panel persistence-panel" aria-label="JSONB persistence workflow">
      <div className="feature-panel__top persistence-panel__top">
        <div>
          <h2>JSONB persistence scenario</h2>
          <p>
            Simulates a real journal entry with YouTube + iframe components, then saves/restores exact content
            using native node-based JSONB payloads you can store in PostgreSQL.
          </p>
        </div>
        <div className="feature-panel__actions">
          <button type="button" className="demo-button demo-button--ghost" onClick={onLoadJournalScenario}>
            Load Journal Scenario
          </button>
          <button type="button" className="demo-button" onClick={onSavePayload}>
            Save JSONB Payload
          </button>
          <button type="button" className="demo-button demo-button--ghost" onClick={onRestorePayload}>
            Restore From Payload
          </button>
          <button type="button" className="demo-button demo-button--ghost" onClick={onCopyPayload}>
            Copy Payload
          </button>
        </div>
      </div>

      <p className="persistence-panel__status" role="status">
        {statusMessage}
      </p>

      <label className="persistence-panel__label" htmlFor="jsonb-payload-editor">
        Persisted JSONB document payload
      </label>
      <textarea
        id="jsonb-payload-editor"
        className="persistence-panel__textarea"
        value={payload}
        onChange={(event) => onPayloadChange(event.target.value)}
        placeholder="Click 'Save JSONB Payload' to generate a persistence payload."
      />
    </section>
  );
}
