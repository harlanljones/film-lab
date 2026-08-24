import { beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_KEY, PLAYBOOK_KEY, SCHEMA_VERSION, loadPlaybook, migrateDocument, resolveSelectedPlay, savePlaybook, upsertPlay } from '../playbookStore';

const play = { id: 'p1', name: 'Mesh', duration: 1, category: 'pass', defenseLook: 'Cover 2', tags: [], notes: '', tracks: [], beats: [], summary: { motive: '', keyDefender: '', whyItWorks: '', counter: '' } };

describe('playbook store', () => {
  beforeEach(() => localStorage.clear());
  it('round trips documents', () => { const doc = { schemaVersion: SCHEMA_VERSION, plays: [play] }; savePlaybook(doc); expect(loadPlaybook()).toEqual(doc); });
  it('migrates v1 to v2', () => { expect(migrateDocument({ schemaVersion: 1, plays: [{ ...play, notes: undefined }] })).toEqual({ schemaVersion: 2, plays: [play] }); });
  it('backs up before overwrite', () => { savePlaybook({ schemaVersion: 2, plays: [play] }); const next = { ...play, id: 'p2' }; savePlaybook({ schemaVersion: 2, plays: [next] }); expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!)).toEqual({ schemaVersion: 2, plays: [play] }); expect(JSON.parse(localStorage.getItem(PLAYBOOK_KEY)!)).toEqual({ schemaVersion: 2, plays: [next] }); });
  it('upserts without dropping unrelated plays', () => { const other = { ...play, id: 'p2' }; const edited = { ...play, name: 'Edited' }; expect(upsertPlay([play, other], edited)).toEqual([edited, other]); expect(upsertPlay([play], other)).toEqual([play, other]); });
  it('resolves selected play and safe fallbacks', () => { const other = { ...play, id: 'p2' }; const fallback = { ...play, id: 'fallback' }; expect(resolveSelectedPlay([play, other], 'p2', fallback)).toEqual(other); expect(resolveSelectedPlay([play, other], 'missing', fallback)).toEqual(play); expect(resolveSelectedPlay([], 'missing', fallback)).toEqual(fallback); });
});
