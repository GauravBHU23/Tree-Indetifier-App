import axios from "axios";

/** A lower-ranked identification candidate. */
export interface AlternativeMatch {
  commonName: string;
  scientificName: string;
  confidenceScore: number;
}

/** Full botanical breakdown returned by the backend (mirrors TreeDetailDto). */
export interface TreeDetail {
  commonName: string;
  scientificName: string;
  leaf: string;
  flower: string;
  fruit: string;
  bark: string;
  habit: string;
  branch: string;
  bud: string;
  seed: string;
  habitat: string;
  uses: string;
  description: string;
  confidenceScore: number;
  imageUrl?: string | null;
  wikipediaUrl?: string | null;
  alternatives: AlternativeMatch[];
}

// Dev: Vite proxies /api to the backend (see vite.config.ts), so baseURL "/" works.
// Prod: set VITE_API_BASE_URL to the deployed App Service URL at build time.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
});

export interface HealthStatus {
  maintenance: boolean;
  message?: string | null;
  /** True when the backend couldn't be reached at all (down/slow). */
  unreachable?: boolean;
}

/**
 * Checks backend health. Returns maintenance=true if the server is in
 * maintenance mode, or unreachable=true if it can't be reached (auto-detect).
 */
export async function checkHealth(): Promise<HealthStatus> {
  try {
    const { data } = await client.get("/api/health", { timeout: 12000 });
    return { maintenance: !!data.maintenance, message: data.message };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    // 503 => server explicitly in maintenance.
    if (status === 503) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      return { maintenance: true, message: msg };
    }
    // No response at all => backend down/slow (cold start, deploy, outage).
    return { maintenance: false, unreachable: true };
  }
}

/** Uploads a captured photo and returns the identified tree's details. */
export async function identifyTree(image: Blob): Promise<TreeDetail> {
  const form = new FormData();
  form.append("image", image, "capture.jpg");

  const { data } = await client.post<TreeDetail>("/api/identify", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
