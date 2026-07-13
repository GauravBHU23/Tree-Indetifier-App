import type { HistoryEntry } from "../services/history";

interface Props {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
}

/** Lists previously scanned plants (from localStorage). Tap one to re-open it. */
export default function HistoryView({ entries, onOpen, onDelete, onClear, onBack }: Props) {
  return (
    <div className="history">
      <div className="history-top">
        <button className="link-btn" onClick={onBack}>← Back</button>
        {entries.length > 0 && (
          <button className="link-btn danger" onClick={onClear}>Clear all</button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="empty">No scans yet. Scan a plant to get started! 🌱</p>
      ) : (
        <ul className="history-list">
          {entries.map((e) => (
            <li className="history-item" key={e.id}>
              <img src={e.thumbnail} alt="" className="history-thumb" onClick={() => onOpen(e)} />
              <div className="history-info" onClick={() => onOpen(e)}>
                <span className="history-name">
                  {e.result.commonName || e.result.scientificName}
                </span>
                <span className="history-date">
                  {new Date(e.timestamp).toLocaleString()}
                </span>
              </div>
              <button className="history-del" onClick={() => onDelete(e.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
