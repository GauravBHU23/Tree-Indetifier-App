import { useState } from "react";
import type { TreeDetail } from "../services/api";
import { isHandoffMode, sendResult } from "../services/handoff";

interface Props {
  result: TreeDetail;
  capturedImage: string | null;
  onReset: () => void;
}

const PARTS: { key: keyof TreeDetail; label: string }[] = [
  { key: "leaf", label: "🍃 Leaf" },
  { key: "flower", label: "🌸 Flower" },
  { key: "fruit", label: "🍎 Fruit" },
  { key: "bark", label: "🪵 Bark" },
  { key: "habit", label: "🌳 Habit" },
  { key: "branch", label: "🌿 Branch" },
  { key: "bud", label: "🌱 Bud" },
  { key: "seed", label: "🌰 Seed" },
  { key: "habitat", label: "🗺️ Habitat" },
  { key: "uses", label: "🛠️ Uses" },
];

/** Shows the identified tree name plus the full botanical breakdown. */
export default function ResultCard({ result, capturedImage, onReset }: Props) {
  const confidence = Math.round(result.confidenceScore * 100);
  // Set when this tab was opened by the Carbon Monitoring App to fetch a species.
  const handoff = isHandoffMode();
  const [handoffFailed, setHandoffFailed] = useState(false);

  function useThisSpecies() {
    if (!sendResult(result)) setHandoffFailed(true);
  }

  // Builds a plain-text summary for sharing / speaking.
  function buildText(): string {
    const name = result.commonName || result.scientificName;
    let text = `${name} (${result.scientificName}).`;
    if (result.description) text += ` ${result.description}`;
    return text;
  }

  async function share() {
    const text = buildText();
    const title = result.commonName || result.scientificName;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: result.wikipediaUrl ?? undefined });
      } catch {
        /* user cancelled — ignore */
      }
    } else {
      // Fallback: copy to clipboard.
      try {
        await navigator.clipboard.writeText(`${text}\n${result.wikipediaUrl ?? ""}`);
        alert("Copied to clipboard!");
      } catch {
        alert("Sharing not supported on this browser.");
      }
    }
  }

  function speak() {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(buildText());
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="result-card">
      <div className="result-header">
        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="result-thumb" />
        )}
        <div>
          <h2>{result.commonName || result.scientificName}</h2>
          <p className="sci-name">{result.scientificName}</p>
          {confidence > 0 && (
            <p className="confidence">Confidence: {confidence}%</p>
          )}
        </div>
      </div>

      {handoff && (
        <div className="handoff-box">
          <button className="handoff-btn" onClick={useThisSpecies}>
            🌳 Use this species in Carbon App →
          </button>
          {handoffFailed ? (
            <p className="handoff-note handoff-warn">
              Couldn't reach the Carbon App tab — it may have been closed.
              Copy the name manually: <b>{result.commonName || result.scientificName}</b>
            </p>
          ) : (
            <p className="handoff-note">
              Sends <b>{result.commonName || result.scientificName}</b> back and closes this tab.
            </p>
          )}
        </div>
      )}

      <div className="action-row">
        <button className="icon-btn" onClick={share}>📤 Share</button>
        <button className="icon-btn" onClick={speak}>🔊 Listen</button>
      </div>

      {result.description && (
        <p className="description">{result.description}</p>
      )}

      <div className="parts-grid">
        {PARTS.map(({ key, label }) => {
          const value = result[key] as string;
          if (!value) return null;
          return (
            <div className="part" key={key}>
              <span className="part-label">{label}</span>
              <span className="part-value">{value}</span>
            </div>
          );
        })}
      </div>

      {result.alternatives?.length > 0 && (
        <div className="alternatives">
          <h3>🤔 Other possible matches</h3>
          {result.alternatives.map((alt, i) => (
            <div className="alt-row" key={i}>
              <span className="alt-name">
                {alt.commonName}
                {alt.commonName !== alt.scientificName && (
                  <em> ({alt.scientificName})</em>
                )}
              </span>
              <span className="alt-conf">
                {Math.round(alt.confidenceScore * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {result.wikipediaUrl && (
        <a
          className="wiki-link"
          href={result.wikipediaUrl}
          target="_blank"
          rel="noreferrer"
        >
          📖 Read more on Wikipedia
        </a>
      )}

      <button className="reset-btn" onClick={onReset}>
        ← Scan another tree
      </button>
    </div>
  );
}
