import { useEffect, useRef, useState } from "react";

interface Props {
  /** Fired automatically the moment a photo is captured — no submit button. */
  onCapture: (image: Blob, previewUrl: string) => void;
  disabled?: boolean;
}

/**
 * Opens the device camera (rear-facing when available) and shows a live preview.
 * Clicking "Capture" grabs a frame and immediately hands the blob to onCapture,
 * which triggers the identify request automatically.
 */
export default function CameraCapture({ onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          "Could not access the camera. Grant camera permission, or use a device with a camera."
        );
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob, URL.createObjectURL(blob));
      },
      "image/jpeg",
      0.9
    );
  }

  if (error) {
    return (
      <div className="camera-error">
        <p>{error}</p>
        <label className="file-fallback">
          Or pick a photo:
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file, URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="camera">
      <video ref={videoRef} playsInline muted className="camera-preview" />
      <div className="camera-actions">
        <button
          className="capture-btn"
          onClick={capture}
          disabled={disabled || !ready}
        >
          📷 Capture &amp; Identify
        </button>
        <label className="gallery-btn">
          🖼️ Gallery
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file, URL.createObjectURL(file));
            }}
          />
        </label>
      </div>
    </div>
  );
}
