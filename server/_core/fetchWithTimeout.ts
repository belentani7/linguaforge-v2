export const FETCH_TIMEOUT_MS = 30_000;

/**
 * fetch with an AbortController-backed deadline so a misbehaving upstream
 * (LLM, image, storage, transcription) can never hang the request forever.
 */
export async function fetchWithTimeout(
  url: string | URL,
  init: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
