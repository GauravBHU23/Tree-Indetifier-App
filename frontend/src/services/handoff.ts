/**
 * handoff.ts
 * ------------------------------------------------------------------
 * Sends an identified species back to the app that opened this one.
 *
 * The Carbon Monitoring App opens the identifier with:
 *     ?return=<origin>&handoff=1
 * and keeps a handle on this window (window.opener). After a scan we post the
 * result to that origin, so the surveyor never retypes the species name.
 *
 * The return origin is echoed back as the postMessage target, never "*", so the
 * result only ever reaches the app that asked for it.
 * ------------------------------------------------------------------
 */
import type { TreeDetail } from "./api";

/** Payload contract shared with the Carbon Monitoring App. */
export interface HandoffPayload {
  type: "tree-identified";
  commonName: string;
  scientificName: string;
  confidenceScore: number;
  wikipediaUrl?: string | null;
}

/** Origins allowed to receive a handoff. Anything else is ignored. */
const ALLOWED = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.azurestaticapps\.net$/,
  /^https:\/\/[a-z0-9-]+\.github\.io$/,
  // Vercel deployments of the Carbon Monitoring App (production + previews).
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];

/** The origin to hand the result back to, or null when not in handoff mode. */
export function getReturnOrigin(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("handoff") !== "1") return null;
  const raw = params.get("return");
  if (!raw) return null;
  let origin: string;
  try {
    origin = new URL(raw).origin;
  } catch {
    return null;
  }
  return ALLOWED.some((re) => re.test(origin)) ? origin : null;
}

/** True when this tab was opened by another app expecting a result back. */
export function isHandoffMode(): boolean {
  return getReturnOrigin() !== null;
}

/**
 * Post the result to the opener and close this tab.
 * Returns false when the opener is gone (user navigated here directly, or the
 * calling tab was closed), so the caller can show a fallback.
 */
export function sendResult(result: TreeDetail): boolean {
  const origin = getReturnOrigin();
  if (!origin) return false;

  const payload: HandoffPayload = {
    type: "tree-identified",
    commonName: result.commonName || result.scientificName,
    scientificName: result.scientificName,
    confidenceScore: result.confidenceScore,
    wikipediaUrl: result.wikipediaUrl ?? null,
  };

  const target = window.opener as Window | null;
  if (!target || target.closed) return false;

  try {
    target.postMessage(payload, origin);
  } catch {
    return false;
  }

  // Give the message a tick to leave before the tab goes away.
  setTimeout(() => {
    try { window.close(); } catch { /* browser may refuse — harmless */ }
  }, 350);
  return true;
}
