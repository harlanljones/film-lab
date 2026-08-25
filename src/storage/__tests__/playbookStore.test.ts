import { beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_KEY, PLAYBOOK_KEY, SCHEMA_VERSION, loadPlaybook, migrateDocument, resolveSelectedPlay, resolveSequence, savePlaybook, upsertPlay } from '../playbookStore';

const play = { id: 'p1', name: 'Mesh', duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [], beats: [], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } };

describe('playbook store', () => {
  beforeEach(() => localStorage.clear());
  it('round trips documents', () => { const doc = { schemaVersion: SCHEMA_VERSION, plays: [play], sequence: ['p1'] }; savePlaybook(doc); expect(loadPlaybook()).toEqual(doc); });
  it('migrates v1 to v3', () => { expect(migrateDocument({ schemaVersion: 1, plays: [{ ...play, notes: undefined }], sequence: [] })).toEqual({ schemaVersion: 3, plays: [play], sequence: [] }); });
  it('migrates v2 to v3 preserving sequence', () => { expect(migrateDocument({ schemaVersion: 2, plays: [play], sequence: ['p1'] })).toEqual({ schemaVersion: 3, plays: [play], sequence: ['p1'] }); });
  it('backs up before overwrite', () => { savePlaybook({ schemaVersion: 3, plays: [play], sequence: [] }); const next = { ...play, id: 'p2' }; savePlaybook({ schemaVersion: 3, plays: [next], sequence: [] }); expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({ schemaVersion: 3, plays: [play], sequence: [] }); expect(JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!)).toEqual({ schemaVersion: 3, plays: [next], sequence: [] }); });
  it('upserts without dropping unrelated plays', () => { const other = { ...play, id: 'p2' }; const edited = { ...play, name: 'Edited' }; expect(upsertPlay([play, other], edited)).toEqual([edited, other]); expect(upsertPlay([play], other)).toEqual([play, other]); });
  it('resolves selected play and safe fallbacks', () => { const other = { ...play, id: 'p2' }; const fallback = { ...play, id: 'fallback' }; expect(resolveSelectedPlay([play, other], 'p2', fallback)).toEqual(other); expect(resolveSelectedPlay([play, other], 'missing', fallback)).toEqual(play); expect(resolveSelectedPlay([], 'missing', fallback)).toEqual(fallback); });
  it('resolves sequence ids in order and falls back to all plays when empty', () => { const other = { ...play, id: 'p2' }; expect(resolveSequence([play, other], ['p2', 'p1'])).toEqual([other, play]); expect(resolveSequence([play, other], ['missing', 'p2'])).toEqual([other]); expect(resolveSequence([play, other], [])).toEqual([play, other]); });
});
