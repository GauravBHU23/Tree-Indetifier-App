import type { TreeDetail } from "./api";

/** One saved scan: the result + a thumbnail (data URL) + when it happened. */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  thumbnail: string; // small data-URL image
  result: TreeDetail;
}

const KEY = "tree-scan-history";
const MAX_ENTRIES = 50;

/** Reads all saved scans, newest first. */
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Saves a new scan to the front of the history (capped at MAX_ENTRIES). */
export function addToHistory(result: TreeDetail, thumbnail: string): HistoryEntry {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    thumbnail,
    result,
  };
  const list = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full (thumbnails are big) — drop oldest and retry once.
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
    } catch {
      /* give up silently — history is best-effort */
    }
  }
  return entry;
}

/** Removes one entry by id. */
export function removeFromHistory(id: string): void {
  const list = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

/** Clears all history. */
export function clearHistory(): void {
  localStorage.removeItem(KEY);
}

/** Shrinks an image blob to a small JPEG data URL for cheap storage/thumbnails. */
export function makeThumbnail(blob: Blob, maxSize = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas ctx"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}
