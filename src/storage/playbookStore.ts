import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Play, RosterPlayer, ScriptItem } from '../engine/types';
import { validatePlay } from '../engine/validate';

export const SCHEMA_VERSION = 4;
export const PLAYBOOK_KEY = 'film-lab.playbook';
export const BACKUP_KEY = 'film-lab.playbook.backup';
export const SELECTED_PLAY_KEY = 'film-lab.selected-play';
export const SEQUENCE_KEY = 'film-lab.sequence';

export type PlaybookDocument = { schemaVersion: number; plays: Play[]; sequence: ScriptItem[]; roster: RosterPlayer[] };
type StorageLike = { getItem(key: string): string | null; setItem(key: string, value: string): void };
const memory = new Map<string, string>();

function storage(): StorageLike {
  if (typeof localStorage !== 'undefined') return localStorage;
  return { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
}

function toScriptItems(sequence: unknown): ScriptItem[] {
  if (!Array.isArray(sequence)) return [];
  return sequence.flatMap((item) => typeof item === 'string' ? [{ playId: item }] : item && typeof item === 'object' && typeof (item as ScriptItem).playId === 'string' ? [{ playId: (item as ScriptItem).playId, reps: (item as ScriptItem).reps }] : []);
}

const emptyDocument = (): PlaybookDocument => ({ schemaVersion: SCHEMA_VERSION, plays: [], sequence: [], roster: [] });

export function migrateDocument(input: unknown): PlaybookDocument {
  if (!input || typeof input !== 'object') return emptyDocument();
  const value = input as { schemaVersion?: unknown; plays?: unknown; sequence?: unknown; roster?: unknown };
  const plays = Array.isArray(value.plays) ? (value.plays as Play[]) : [];
  const sequence = toScriptItems(value.sequence);
  const roster = Array.isArray(value.roster) ? (value.roster as RosterPlayer[]) : [];
  if (value.schemaVersion === 1) {
    return { schemaVersion: SCHEMA_VERSION, plays: plays.map((play) => ({ ...play, notes: play.notes ?? '' })), sequence, roster };
  }
  if (value.schemaVersion === 2 || value.schemaVersion === 3) {
    return { schemaVersion: SCHEMA_VERSION, plays, sequence, roster };
  }
  if (value.schemaVersion === SCHEMA_VERSION) return { schemaVersion: SCHEMA_VERSION, plays, sequence, roster };
  return emptyDocument();
}

export function loadPlaybook(): PlaybookDocument {
  const raw = storage().getItem(PLAYBOOK_KEY);
  if (!raw) return emptyDocument();
  try { return migrateDocument(JSON.parse(raw)); } catch { return emptyDocument(); }
}

export function savePlaybook(document: PlaybookDocument): void {
  const next = JSON.stringify({ ...document, schemaVersion: SCHEMA_VERSION });
  const store = storage();
  const previous = store.getItem(PLAYBOOK_KEY);
  try {
    if (previous) store.setItem(BACKUP_KEY, previous);
    store.setItem(PLAYBOOK_KEY, next);
  } catch (error) {
    if (previous) store.setItem(PLAYBOOK_KEY, previous);
    throw new Error('Unable to save playbook: storage quota exceeded', { cause: error });
  }
}

export function upsertPlay(plays: Play[], play: Play): Play[] {
  const index = plays.findIndex((existing) => existing.id === play.id);
  if (index < 0) return [...plays, play];
  return plays.map((existing, currentIndex) => currentIndex === index ? play : existing);
}

export function resolveSelectedPlay(plays: Play[], selectedPlayId: string | null, fallback: Play): Play {
  return plays.find((play) => play.id === selectedPlayId) ?? plays[0] ?? fallback;
}

export function resolveSequence(plays: Play[], sequence: ScriptItem[]): Play[] {
  if (!sequence.length) return plays;
  const byId = new Map(plays.map((play) => [play.id, play]));
  return sequence.map((item) => byId.get(item.playId)).filter((play): play is Play => play !== undefined);
}

export function exportPlaybook(plays: Play[]): string {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, plays }, null, 2);
}

export function importPlaybook(raw: string, current: Play[] = []): Play[] {
  const incoming = parseImport(raw).plays;
  if (incoming.some((play) => !isShapedPlay(play) || validatePlay(play).length > 0)) {
    throw new Error('Import rejected: one or more plays failed validation');
  }
  return (incoming as Play[]).reduce(upsertPlay, [...current]);
}

export function exportPlaybookDocument(document: PlaybookDocument): string {
  return JSON.stringify({ ...document, schemaVersion: SCHEMA_VERSION }, null, 2);
}

export function importPlaybookDocument(raw: string, current: PlaybookDocument): PlaybookDocument {
  const { source, plays: incoming } = parseImport(raw);
  if (incoming.some((play) => !isShapedPlay(play) || validatePlay(play).length > 0)) {
    throw new Error('Import rejected: one or more plays failed validation');
  }
  return { schemaVersion: SCHEMA_VERSION, plays: (incoming as Play[]).reduce(upsertPlay, [...current.plays]), sequence: toScriptItems(source.sequence), roster: Array.isArray(source.roster) ? (source.roster as RosterPlayer[]) : current.roster };
}

export type ImportBucket = 'new' | 'updated' | 'unchanged' | 'invalid';
export type ImportCandidate =
  | { bucket: 'new'; play: Play }
  | { bucket: 'updated'; play: Play; current: Play }
  | { bucket: 'unchanged'; play: Play }
  | { bucket: 'invalid'; id: string; name: string; problems: string[] };
export type ImportPlan = { entries: ImportCandidate[]; counts: Record<ImportBucket, number> };

const UNFORMED_PLAY_PROBLEM = 'Import rejected: one or more plays failed validation';

function isShapedPlay(candidate: unknown): candidate is Play {
  return typeof candidate === 'object' && candidate !== null && 'id' in candidate && Array.isArray((candidate as { tracks?: unknown }).tracks);
}

function parseImport(raw: string): { source: Record<string, unknown>; plays: unknown[] } {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Import rejected: invalid JSON'); }
  if (!parsed || typeof parsed !== 'object' || (parsed as { schemaVersion?: unknown }).schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Import rejected: expected schemaVersion ${SCHEMA_VERSION}`);
  }
  const source = parsed as Record<string, unknown>;
  if (!Array.isArray(source.plays)) throw new Error(UNFORMED_PLAY_PROBLEM);
  return { source, plays: source.plays };
}

function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableValue(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export function planImport(raw: string, current: Play[]): ImportPlan {
  const { plays: incoming } = parseImport(raw);
  const byId = new Map(current.map((play) => [play.id, play]));
  const entries: ImportCandidate[] = [];
  const counts: ImportPlan['counts'] = { new: 0, updated: 0, unchanged: 0, invalid: 0 };
  for (const candidate of incoming) {
    if (!isShapedPlay(candidate) || validatePlay(candidate).length > 0) {
      const record = (candidate ?? {}) as { id?: unknown; name?: unknown };
      entries.push({
        bucket: 'invalid',
        id: typeof record.id === 'string' ? record.id : '',
        name: typeof record.name === 'string' ? record.name : '',
        problems: isShapedPlay(candidate) ? validatePlay(candidate) : [UNFORMED_PLAY_PROBLEM],
      });
      counts.invalid += 1;
      continue;
    }
    const existing = byId.get(candidate.id);
    if (!existing) { entries.push({ bucket: 'new', play: candidate }); counts.new += 1; continue; }
    if (stableValue(existing) === stableValue(candidate)) { entries.push({ bucket: 'unchanged', play: candidate }); counts.unchanged += 1; continue; }
    entries.push({ bucket: 'updated', play: candidate, current: existing });
    counts.updated += 1;
  }
  return { entries, counts };
}

export type PlaybookStore = {
  plays: Play[];
  selectedPlayId: string | null;
  sequence: ScriptItem[];
  roster: RosterPlayer[];
  save: (plays: Play[]) => void;
  setSequence: (sequence: ScriptItem[]) => void;
  setRoster: (roster: RosterPlayer[]) => void;
  addRosterPlayer: (player: RosterPlayer) => void;
  updateRosterPlayer: (id: string, patch: Partial<Omit<RosterPlayer, 'id'>>) => void;
  removeRosterPlayer: (id: string) => void;
  upsert: (play: Play) => void;
  select: (play: Play) => void;
  add: (play: Play) => void;
  remove: (id: string) => void;
  error: string | null;
};

const PlaybookContext = createContext<PlaybookStore | null>(null);

export function PlaybookProvider({ children }: { children: ReactNode }) {
  const [document, setDocument] = useState<PlaybookDocument>(() => loadPlaybook());
  const [selectedPlayId, setSelectedPlayId] = useState<string | null>(() => storage().getItem(SELECTED_PLAY_KEY));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    try { savePlaybook(document); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save playbook'); }
  }, [document]);
  const save = useCallback((plays: Play[]) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, plays })), []);
  const setSequence = useCallback((sequence: ScriptItem[]) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, sequence })), []);
  const setRoster = useCallback((roster: RosterPlayer[]) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, roster })), []);
  const addRosterPlayer = useCallback((player: RosterPlayer) => setDocument((current) => (current.roster.some((existing) => existing.id === player.id) ? current : { ...current, schemaVersion: SCHEMA_VERSION, roster: [...current.roster, player] })), []);
  const updateRosterPlayer = useCallback((id: string, patch: Partial<Omit<RosterPlayer, 'id'>>) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, roster: current.roster.map((player) => player.id === id ? { ...player, ...patch } : player) })), []);
  const removeRosterPlayer = useCallback((id: string) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, roster: current.roster.filter((player) => player.id !== id) })), []);
  const upsert = useCallback((play: Play) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) })), []);
  const select = useCallback((play: Play) => {
    setSelectedPlayId(play.id);
    storage().setItem(SELECTED_PLAY_KEY, play.id);
    setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) }));
  }, []);
  const add = useCallback((play: Play) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, plays: upsertPlay(current.plays, play) })), []);
  const remove = useCallback((id: string) => setDocument((current) => ({ ...current, schemaVersion: SCHEMA_VERSION, plays: current.plays.filter((play) => play.id !== id), sequence: current.sequence.filter((item) => item.playId !== id) })), []);
  return createElement(PlaybookContext.Provider, { value: { plays: document.plays, selectedPlayId, sequence: document.sequence, roster: document.roster, save, setSequence, setRoster, addRosterPlayer, updateRosterPlayer, removeRosterPlayer, upsert, select, add, remove, error } }, children);
}

export function usePlaybook(): PlaybookStore {
  const context = useContext(PlaybookContext);
  if (!context) throw new Error('usePlaybook must be used within PlaybookProvider');
  return context;
}
