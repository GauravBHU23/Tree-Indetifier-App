import { useEffect, useState } from "react";
import CameraCapture from "./components/CameraCapture";
import ResultCard from "./components/ResultCard";
import InstallButton from "./components/InstallButton";
import HistoryView from "./components/HistoryView";
import MaintenanceScreen from "./components/MaintenanceScreen";
import { identifyTree, checkHealth, type TreeDetail } from "./services/api";
import {
  addToHistory,
  getHistory,
  makeThumbnail,
  removeFromHistory,
  clearHistory,
  type HistoryEntry,
} from "./services/history";
import { useTheme } from "./hooks/useTheme";
import "./App.css";

type Status = "checking" | "camera" | "loading" | "result" | "error" | "history" | "maintenance";

export default function App() {
  const [status, setStatus] = useState<Status>("checking");
  const [result, setResult] = useState<TreeDetail | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());
  const [maintInfo, setMaintInfo] = useState<{ message?: string | null; unreachable?: boolean }>({});
  const [retrying, setRetrying] = useState(false);
  const { theme, toggle } = useTheme();

  // On load (and on retry), check backend health → show app or maintenance screen.
  async function runHealthCheck() {
    setRetrying(true);
    const health = await checkHealth();
    setRetrying(false);
    if (health.maintenance || health.unreachable) {
      setMaintInfo({ message: health.message, unreachable: health.unreachable });
      setStatus("maintenance");
    } else {
      setStatus("camera");
    }
  }

  useEffect(() => {
    runHealthCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fired automatically on capture / gallery pick — no manual submit step.
  async function handleCapture(image: Blob, previewUrl: string) {
    setCapturedImage(previewUrl);
    setStatus("loading");
    try {
      const data = await identifyTree(image);
      setResult(data);
      setStatus("result");

      // Save to history with a small thumbnail (best-effort).
      try {
        const thumb = await makeThumbnail(image);
        addToHistory(data, thumb);
        setHistory(getHistory());
      } catch {
        /* thumbnail failed — result still shown */
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 503 = maintenance turned on mid-session; no response = backend down.
      const noResponse = !(err as { response?: unknown })?.response;
      if (status === 503 || noResponse) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        setMaintInfo({ message: msg, unreachable: noResponse });
        setStatus("maintenance");
        return;
      }
      const msg =
        (err as { response?: { data?: string } })?.response?.data ??
        "Something went wrong while identifying the tree.";
      setErrorMsg(typeof msg === "string" ? msg : "Identification failed.");
      setStatus("error");
    }
  }

  function reset() {
    setResult(null);
    setCapturedImage(null);
    setErrorMsg("");
    setStatus("camera");
  }

  function openHistoryEntry(entry: HistoryEntry) {
    setResult(entry.result);
    setCapturedImage(entry.thumbnail);
    setStatus("result");
  }

  function deleteEntry(id: string) {
    removeFromHistory(id);
    setHistory(getHistory());
  }

  function clearAll() {
    clearHistory();
    setHistory([]);
  }

  // While checking backend health on first load.
  if (status === "checking") {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  // Maintenance / backend-down full screen (no header buttons).
  if (status === "maintenance") {
    return (
      <div className="app">
        <MaintenanceScreen
          message={maintInfo.message}
          unreachable={maintInfo.unreachable}
          onRetry={runHealthCheck}
          retrying={retrying}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <button className="icon-only" onClick={() => setStatus("history")} title="History">
            🕘
          </button>
          <button className="icon-only" onClick={toggle} title="Toggle theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
        <h1>🌳 Tree Identifier</h1>
        <p>Point your camera at a tree, leaf, or flower and capture.</p>
        <InstallButton />
      </header>

      <main>
        {status === "camera" && <CameraCapture onCapture={handleCapture} />}

        {status === "loading" && (
          <div className="loading">
            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="loading-thumb" />
            )}
            <div className="spinner" />
            <p>Identifying tree…</p>
          </div>
        )}

        {status === "result" && result && (
          <ResultCard
            result={result}
            capturedImage={capturedImage}
            onReset={reset}
          />
        )}

        {status === "error" && (
          <div className="error-box">
            <p>{errorMsg}</p>
            <button className="reset-btn" onClick={reset}>
              Try again
            </button>
          </div>
        )}

        {status === "history" && (
          <HistoryView
            entries={history}
            onOpen={openHistoryEntry}
            onDelete={deleteEntry}
            onClear={clearAll}
            onBack={reset}
          />
        )}
      </main>
    </div>
  );
}
