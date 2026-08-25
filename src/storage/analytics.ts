/**
 * Film Lab — privacy-respecting usage counters (FL-DEPLOY-09 / HJ-407).
 *
 * LOCAL-FIRST: this app has no backend, so no granular event leaves the browser.
 * Counters persist in localStorage keyed by an anonymous per-install UUID and are
 * surfaced for the single-coach Q1 feedback flow. There is NO user-identifying
 * signal, no cookies, and no third-party call other than the optional Cloudflare
 * Web Analytics page beacon (opt-in, token-gated in index.html — see FL-DEPLOY-09).
 *
 * Events (all local counters, zero PII):
 *   - play_opened  : a play was revealed/played in the Film Room (1/unique ply/session)
 *   - play_saved   : a play was saved from the Editor
 *   - play_shared  : a share URL was produced (copy-to-clipboard)
 *   - script_opened: a multi-play sequence (practice script) was run in the Film Room
 *
 * Counters are rolled up on each page load (accumulate into daily buckets) so a
 * "did the coach return?" signal survives reloads without any network call.
 */

const INSTALL_KEY = 'fl_analytics_install';
const COUNTS_KEY = 'fl_analytics_counts';
const LAST_LOAD_KEY = 'fl_analytics_last_load';
const EVENTS = ['play_opened', 'play_saved', 'play_shared', 'script_opened'] as const;
export type AnalyticsEvent = (typeof EVENTS)[number];

type Counts = Record<AnalyticsEvent, number> & { opens: Record<string, number> };

function emptyCounts(): Counts {
  return { play_opened: 0, play_saved: 0, play_shared: 0, script_opened: 0, opens: {} };
}

function safeStorage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}

/** Anonymous, stable per-install id (no user data; regenerates only if storage cleared). */
export function installId(): string {
  const storage = safeStorage();
  if (!storage) return 'anonymous';
  let value = storage.getItem(INSTALL_KEY);
  if (!value) {
    value = `fl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    storage.setItem(INSTALL_KEY, value);
  }
  return value;
}

function readCounts(): Counts {
  const storage = safeStorage();
  if (!storage) return emptyCounts();
  try {
    const parsed: unknown = JSON.parse(storage.getItem(COUNTS_KEY) ?? 'null');
    return parsed && typeof parsed === 'object' ? { ...emptyCounts(), ...(parsed as Partial<Counts>) } : emptyCounts();
  } catch { return emptyCounts(); }
}

function writeCounts(counts: Counts): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(COUNTS_KEY, JSON.stringify(counts));
  // Keep the opens map bounded: no per-play unbounded growth on a coach's machine.
  if (Object.keys(counts.opens).length > 200) counts.opens = {};
}

function isNewDay(): boolean {
  const storage = safeStorage();
  if (!storage) return true;
  const today = new Date().toISOString().slice(0, 10);
  const last = storage.getItem(LAST_LOAD_KEY);
  if (last === today) return false;
  storage.setItem(LAST_LOAD_KEY, today);
  return true;
}

/**
 * Record a usage event. `opened`/`scriptOpened` dedupe per play per session.
 * Returns the current public-readable counter snapshot.
 */
export function trackEvent(event: AnalyticsEvent, opts?: { playId?: string; session?: Set<string> }): Counts {
  const counts = readCounts();
  if (event === 'play_opened' || event === 'script_opened') {
    const playId = opts?.playId ?? 'default';
    const seen = opts?.session;
    if (seen) {
      if (seen.has(playId)) return counts;
      seen.add(playId);
    }
    counts[event] += 1;
    counts.opens[playId] = (counts.opens[playId] ?? 0) + 1;
  } else {
    counts[event] += 1;
  }
  writeCounts(counts);
  return counts;
}

/** Minimal, cookie-free rollup: counters survive reloads (no network endpoints to call). */
export function rolloutOnLoad(): void {
  isNewDay(); // refresh the daily marker so a returning coach trips the "new day" counter
  readCounts(); // ensure the bucket exists
}

/** Read the current counters (for the feedback flow / UI readout). */
export function getCounts(): Counts {
  return readCounts();
}

// Dedupe set: 1× per play per page session for the Film Room events.
const sessionOpened = new Set<string>();

/** A play was revealed/played in the Film Room (1× per play per session). */
export function recordPlayOpened(playId?: string): void {
  trackEvent('play_opened', { playId, session: sessionOpened });
}

/** A multi-play sequence (practice script) was run in the Film Room (1× per script per session). */
export function recordScriptOpened(scriptId?: string): void {
  trackEvent('script_opened', { playId: scriptId, session: sessionOpened });
}

/** A play was saved from the Editor. */
export function recordPlaySaved(): void {
  trackEvent('play_saved');
}

/** A share URL was produced (copy-to-clipboard). */
export function recordPlayShared(): void {
  trackEvent('play_shared');
}

/**
 * Load the Cloudflare Web Analytics page beacon ONLY when a real token is
 * provided at build time via VITE_CF_WEB_ANALYTICS_TOKEN. Off by default —
 * no beacon, no network call, no console noise — so the local-first /
 * single-coach-opt-in framing holds until the user opts in. The token is a
 * public site id (not a secret) but is supplied via env, never hardcoded.
 */
export function initWebAnalyticsBeacon(): void {
  const token = import.meta.env.VITE_CF_WEB_ANALYTICS_TOKEN as string | undefined;
  if (!token || token.includes('VITE_CF_WEB_ANALYTICS_TOKEN')) return;
  const head = typeof document !== 'undefined' ? document.head : null;
  if (!head) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.dataset.cfBeacon = JSON.stringify({ token });
  head.appendChild(s);
}
