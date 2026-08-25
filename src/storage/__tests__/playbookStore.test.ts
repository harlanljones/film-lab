import { beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_KEY, PLAYBOOK_KEY, SCHEMA_VERSION, loadPlaybook, migrateDocument, planImport, resolveSelectedPlay, resolveSequence, savePlaybook, upsertPlay } from '../playbookStore';
import { seededPlay } from '../../data/seededPlay';
import { validatePlay } from '../../engine/validate';

const play = { id: 'p1', name: 'Mesh', duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [], beats: [], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } };
const withSortedKeys = (value: unknown): unknown => Array.isArray(value) ? value.map(withSortedKeys) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([key, inner]) => [key, withSortedKeys(inner)])) : value;

describe('playbook store', () => {
  beforeEach(() => localStorage.clear());
  it('round trips documents', () => { const doc = { schemaVersion: SCHEMA_VERSION, plays: [play], sequence: ['p1'] }; savePlaybook(doc); expect(loadPlaybook()).toEqual(doc); });
  it('migrates v1 to v3', () => { expect(migrateDocument({ schemaVersion: 1, plays: [{ ...play, notes: undefined }], sequence: [] })).toEqual({ schemaVersion: 3, plays: [play], sequence: [] }); });
  it('migrates v2 to v3 preserving sequence', () => { expect(migrateDocument({ schemaVersion: 2, plays: [play], sequence: ['p1'] })).toEqual({ schemaVersion: 3, plays: [play], sequence: ['p1'] }); });
  it('round trips user group tags on plays across reload', () => { const grouped = { ...play, tags: ['starter', 'red zone', 'goal line'] }; savePlaybook({ schemaVersion: SCHEMA_VERSION, plays: [grouped], sequence: [] }); expect(loadPlaybook()).toEqual({ schemaVersion: SCHEMA_VERSION, plays: [grouped], sequence: [] }); });
  it('migrates legacy documents without touching play tags', () => { const grouped = { ...play, tags: ['fall package'] }; expect(migrateDocument({ schemaVersion: 2, plays: [grouped], sequence: [] })).toEqual({ schemaVersion: 3, plays: [grouped], sequence: [] }); });
  it('backs up before overwrite', () => { savePlaybook({ schemaVersion: 3, plays: [play], sequence: [] }); const next = { ...play, id: 'p2' }; savePlaybook({ schemaVersion: 3, plays: [next], sequence: [] }); expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({ schemaVersion: 3, plays: [play], sequence: [] }); expect(JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!)).toEqual({ schemaVersion: 3, plays: [next], sequence: [] }); });
  it('upserts without dropping unrelated plays', () => { const other = { ...play, id: 'p2' }; const edited = { ...play, name: 'Edited' }; expect(upsertPlay([play, other], edited)).toEqual([edited, other]); expect(upsertPlay([play], other)).toEqual([play, other]); });
  it('resolves selected play and safe fallbacks', () => { const other = { ...play, id: 'p2' }; const fallback = { ...play, id: 'fallback' }; expect(resolveSelectedPlay([play, other], 'p2', fallback)).toEqual(other); expect(resolveSelectedPlay([play, other], 'missing', fallback)).toEqual(play); expect(resolveSelectedPlay([], 'missing', fallback)).toEqual(fallback); });
  it('resolves sequence ids in order and falls back to all plays when empty', () => { const other = { ...play, id: 'p2' }; expect(resolveSequence([play, other], ['p2', 'p1'])).toEqual([other, play]); expect(resolveSequence([play, other], ['missing', 'p2'])).toEqual([other]); expect(resolveSequence([play, other], [])).toEqual([play, other]); });
  it('planImport rejects invalid JSON with the structural message', () => { expect(() => planImport('{nope', [])).toThrow('Import rejected: invalid JSON'); });
  it('planImport rejects a wrong schemaVersion with the exact message', () => { expect(() => planImport('{"schemaVersion":2,"plays":[]}', [])).toThrow(`Import rejected: expected schemaVersion ${SCHEMA_VERSION}`); });
  it('planImport classifies one file into all four buckets', () => {
    const alpha = { ...seededPlay, id: 'alpha', name: 'Alpha' };
    const gamma = { ...seededPlay, id: 'gamma', name: 'Gamma' };
    const beta = { ...seededPlay, id: 'beta', name: 'Beta' };
    const edited = { ...gamma, notes: 'Updated scouting note.' };
    const broken = { ...seededPlay, id: 'broken', name: 'Broken', tracks: seededPlay.tracks.slice(0, 6) };
    const plan = planImport(JSON.stringify({ schemaVersion: SCHEMA_VERSION, plays: [{ ...alpha }, beta, edited, broken] }), [alpha, gamma]);
    expect(plan.counts).toEqual({ new: 1, updated: 1, unchanged: 1, invalid: 1 });
    expect(plan.entries.map((entry) => entry.bucket)).toEqual(['unchanged', 'new', 'updated', 'invalid']);
    expect(plan.entries[0]).toEqual({ bucket: 'unchanged', play: alpha });
    expect(plan.entries[1]).toEqual({ bucket: 'new', play: beta });
    expect(plan.entries[2]).toEqual({ bucket: 'updated', play: edited, current: gamma });
    expect(plan.entries[3]).toMatchObject({ bucket: 'invalid', id: 'broken', name: 'Broken', problems: validatePlay(broken) });
  });
  it('planImport detects deep equality regardless of key order', () => {
    const alpha = { ...seededPlay, id: 'alpha' };
    const raw = JSON.stringify({ plays: [withSortedKeys(alpha)], schemaVersion: SCHEMA_VERSION });
    const plan = planImport(raw, [alpha]);
    expect(plan.counts).toEqual({ new: 0, updated: 0, unchanged: 1, invalid: 0 });
    expect(plan.entries[0]).toEqual({ bucket: 'unchanged', play: alpha });
  });
  it('planImport surfaces per-play problem strings without rejecting the file', () => {
    const broken = { ...seededPlay, id: 'broken', name: 'Broken', tracks: [] };
    const healthy = { ...seededPlay, id: 'healthy', name: 'Healthy' };
    const brokenProblems = validatePlay(broken);
    expect(brokenProblems.length).toBeGreaterThan(0);
    const plan = planImport(JSON.stringify({ schemaVersion: SCHEMA_VERSION, plays: [broken, healthy] }), []);
    expect(plan.counts.invalid).toBe(1);
    expect(plan.counts.new).toBe(1);
    expect(plan.entries[0]).toMatchObject({ bucket: 'invalid', id: 'broken', name: 'Broken', problems: brokenProblems });
    expect(plan.entries[1]).toEqual({ bucket: 'new', play: healthy });
  });
});
