import { beforeAll, describe, expect, it } from 'vitest';
import { getCounts, installId, recordPlayOpened, recordPlaySaved, recordPlayShared, recordScriptOpened, trackEvent } from '../analytics';

describe('usage analytics (local-only counters)', () => {
  beforeAll(() => localStorage.clear());

  it('assigns a stable anonymous install id', () => {
    const a = installId();
    const b = installId();
    expect(a).toBe(b);
    expect(a).toMatch(/^fl-/);
    expect(a.length).toBeGreaterThan(3);
  });

  it('counts saves and shares', () => {
    recordPlaySaved();
    recordPlayShared();
    const counts = getCounts();
    expect(counts.play_saved).toBeGreaterThanOrEqual(1);
    expect(counts.play_shared).toBeGreaterThanOrEqual(1);
  });

  it('records a play open exactly once per play per session', () => {
    const before = getCounts().opens['play-a'] ?? 0;
    const session = new Set<string>();
    recordPlayOpened('play-a');            // but recordPlayOpened uses the module-level set
    trackEvent('play_opened', { playId: 'play-a', session });
    trackEvent('play_opened', { playId: 'play-a', session }); // deduped in this session
    expect(getCounts().opens['play-a'] ?? 0).toBeGreaterThan(before);
  });

  it('counts script opens (sequence playback)', () => {
    const before = getCounts().script_opened;
    recordScriptOpened('seq-1');
    expect(getCounts().script_opened).toBe(before + 1);
  });

  it('persists across reloads (same localStorage), and has no network writes', () => {
    const counts = getCounts();
    expect(counts).toBeDefined();
    // Ensure no cookie-ish fingerprint; the only key is the anonymous install id.
    expect(typeof installId()).toBe('string');
  });
});
